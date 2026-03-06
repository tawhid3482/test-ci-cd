import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  PrismaClient,
  PromoCode,
  STATUS,
} from "@prisma/client";
import AppError from "../../helpers/AppError";
import { envVars } from "../../config/env";

const prisma = new PrismaClient();

type CreateOrderPayload = {
  shippingAddress?: string;
  phone?: string;
  note?: string;
  promoCode?: string;
  deliveryFee?: number;
  paymentMethod?: PaymentMethod;
};

type OrderQuery = Record<string, unknown>;
type GatewayPayload = Record<string, unknown>;

type SslInitResult = {
  paymentUrl: string;
  sessionKey: string;
  gatewayResponse: GatewayPayload;
};
type RevenueChartPoint = {
  label: string;
  revenue: number;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const sortableOrderFields = [
  "createdAt",
  "updatedAt",
  "totalAmount",
  "subtotal",
  "status",
  "paymentStatus",
] as const;

type SortableOrderField = (typeof sortableOrderFields)[number];

const getQueryString = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    const firstValue = value[0];
    return typeof firstValue === "string" ? firstValue : undefined;
  }

  return typeof value === "string" ? value : undefined;
};

const getQueryNumber = (value: unknown): number | undefined => {
  const numericValue = Number(getQueryString(value));
  return Number.isFinite(numericValue) ? numericValue : undefined;
};

const getQueryDate = (value: unknown): Date | undefined => {
  const dateValue = getQueryString(value);
  if (!dateValue) {
    return undefined;
  }

  const parsedDate = new Date(dateValue);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
};

const isValidObjectId = (value: string) => /^[a-fA-F0-9]{24}$/.test(value);

const orderInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          images: true,
          price: true,
        },
      },
    },
  },
  promoCode: {
    select: {
      id: true,
      code: true,
      discountPercentage: true,
    },
  },
  paymentHistories: {
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      paymentMethod: true,
      paymentStatus: true,
      paymentGateway: true,
      amount: true,
      transactionId: true,
      gatewaySessionKey: true,
      paidAt: true,
      failedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} as const;

const normalizePromoCode = (promoCode: string) => promoCode.trim().toUpperCase();
const roundToTwo = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const formatUtcDateLabel = (date: Date) => date.toISOString().slice(0, 10);
const formatUtcMonthLabel = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
const formatUtcYearLabel = (date: Date) => String(date.getUTCFullYear());
const toPrismaJson = (value?: GatewayPayload): Prisma.InputJsonValue | null => {
  if (!value) {
    return null;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
};
const buildRevenueSeries = (
  labels: string[],
  orders: Array<{ createdAt: Date; totalAmount: number }>,
  formatter: (date: Date) => string,
): RevenueChartPoint[] => {
  const revenueMap = new Map<string, number>();

  for (const order of orders) {
    const key = formatter(order.createdAt);
    revenueMap.set(key, (revenueMap.get(key) || 0) + order.totalAmount);
  }

  return labels.map((label) => ({
    label,
    revenue: roundToTwo(revenueMap.get(label) || 0),
  }));
};

const getSslGatewayConfig = () => {
  const isProduction = envVars.NODE_ENV.toLowerCase() === "production";
  const storeId = envVars.SSLCOMMERZ_STORE_ID?.trim();
  const storePassword = envVars.SSLCOMMERZ_STORE_PASSWORD?.trim();

  if (!storeId || !storePassword) {
    throw new AppError(500, "SSLCommerz credentials are not configured");
  }

  const backendBaseUrl =
    envVars.BACKEND_URL?.trim() || `http://localhost:${envVars.PORT}`;

  return {
    storeId,
    storePassword,
    backendBaseUrl,
    initUrl: isProduction
      ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
      : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
  };
};

const initializeSslCommerzSession = async (params: {
  orderId: string;
  userId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress?: string;
}): Promise<SslInitResult> => {
  const config = getSslGatewayConfig();
  const transactionId = `ORD-${params.orderId.slice(-8)}-${Date.now().toString().slice(-8)}`;

  const payload = new URLSearchParams({
    store_id: config.storeId,
    store_passwd: config.storePassword,
    total_amount: String(params.amount),
    currency: "BDT",
    tran_id: transactionId,
    success_url: `${envVars.FRONTEND_URL}/dashboard/user/payments/ssl/success`,
    fail_url: `${envVars.FRONTEND_URL}/dashboard/user/payments/ssl/fail`,
    cancel_url: `${envVars.FRONTEND_URL}/dashboard/user/payments/ssl/fail`,
    ipn_url: `${envVars.FRONTEND_URL}/dashboard/user/payments/ssl/success`,
    shipping_method: "NO",
    product_name: `Order-${params.orderId.slice(-6)}`,
    product_category: "E-commerce",
    product_profile: "general",
    cus_name: params.customerName,
    cus_email: params.customerEmail,
    cus_add1: params.shippingAddress || "N/A",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    cus_phone: params.customerPhone,
    value_a: params.orderId,
    value_b: params.userId,
  });

  const response = await fetch(config.initUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload.toString(),
  });

  if (!response.ok) {
    throw new AppError(502, "Failed to initialize SSLCommerz session");
  }

  const data = (await response.json()) as GatewayPayload;
  const status = String(data.status || "").toLowerCase();
  const paymentUrl = String(data.GatewayPageURL || "");
  const sessionKey = String(data.sessionkey || "");

  if (status !== "success" || !paymentUrl) {
    const message = String(data.failedreason || "SSLCommerz session init failed");
    throw new AppError(400, message);
  }

  return {
    paymentUrl,
    sessionKey,
    gatewayResponse: data,
  };
};

const validatePromoEligibility = (promo: PromoCode, subtotal: number, now: Date) => {
  if (!promo.isActive) {
    throw new AppError(400, "Promo code is inactive");
  }

  if (promo.startsAt && now < promo.startsAt) {
    throw new AppError(400, "Promo code is not active yet");
  }

  if (promo.expiresAt && now > promo.expiresAt) {
    throw new AppError(400, "Promo code has expired");
  }

  if (typeof promo.minOrderAmount === "number" && subtotal < promo.minOrderAmount) {
    throw new AppError(400, `Minimum order amount for this promo is ${promo.minOrderAmount}`);
  }

  if (typeof promo.usageLimit === "number" && promo.usedCount >= promo.usageLimit) {
    throw new AppError(400, "Promo code usage limit exceeded");
  }
};

const getPromoByCode = async (promoCode: string) => {
  const normalizedCode = normalizePromoCode(promoCode);

  const promo = await prisma.promoCode.findUnique({
    where: {
      code: normalizedCode,
    },
  });

  if (!promo) {
    throw new AppError(400, "Invalid promo code");
  }

  return promo;
};

const createOrderFromCart = async (userId: string, payload: CreateOrderPayload) => {
  const paymentMethod = payload.paymentMethod ?? PaymentMethod.COD;

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          status: true,
          images: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!cartItems.length) {
    throw new AppError(400, "Cart is empty");
  }

  for (const item of cartItems) {
    if (item.product.status !== STATUS.ACTIVE) {
      throw new AppError(400, `${item.product.name} is not available right now`);
    }

    if (item.quantity > item.product.stock) {
      throw new AppError(
        400,
        `${item.product.name} has only ${item.product.stock} item(s) left in stock`,
      );
    }
  }

  const subtotal = roundToTwo(
    cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  );
  const deliveryFee = roundToTwo(payload.deliveryFee ?? 0);

  const now = new Date();
  const promo = payload.promoCode ? await getPromoByCode(payload.promoCode) : null;

  if (promo) {
    validatePromoEligibility(promo, subtotal, now);
  }

  const discountPercentage = promo ? promo.discountPercentage : 0;
  const discountAmount = promo ? roundToTwo((subtotal * discountPercentage) / 100) : 0;
  const totalAmount = roundToTwo(Math.max(0, subtotal + deliveryFee - discountAmount));

  const order = await prisma.$transaction(async (tx) => {
    if (paymentMethod === PaymentMethod.COD) {
      for (const item of cartItems) {
        const stockUpdateResult = await tx.product.updateMany({
          where: {
            id: item.productId,
            status: STATUS.ACTIVE,
            stock: {
              gte: item.quantity,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (stockUpdateResult.count !== 1) {
          throw new AppError(
            400,
            `${item.product.name} is out of stock or has insufficient quantity`,
          );
        }
      }
    }

    let appliedPromo: PromoCode | null = null;

    if (promo) {
      const latestPromo = await tx.promoCode.findUnique({
        where: {
          id: promo.id,
        },
      });

      if (!latestPromo) {
        throw new AppError(400, "Promo code is no longer available");
      }

      validatePromoEligibility(latestPromo, subtotal, new Date());

      const usageUpdateResult = await tx.promoCode.updateMany({
        where: {
          id: latestPromo.id,
          ...(typeof latestPromo.usageLimit === "number"
            ? {
                usedCount: {
                  lt: latestPromo.usageLimit,
                },
              }
            : {}),
        },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      });

      if (usageUpdateResult.count !== 1) {
        throw new AppError(400, "Promo code usage limit exceeded");
      }

      appliedPromo = latestPromo;
    }

    const createdOrder = await tx.order.create({
      data: {
        userId,
        shippingAddress: payload.shippingAddress,
        phone: payload.phone,
        note: payload.note,
        subtotal,
        deliveryFee,
        discountAmount,
        discountPercentage,
        promoCodeId: appliedPromo?.id ?? null,
        appliedPromoCode: appliedPromo?.code ?? null,
        totalAmount,
        status: OrderStatus.PENDING,
        paymentMethod,
        paymentStatus:
          paymentMethod === PaymentMethod.COD ? PaymentStatus.UNPAID : PaymentStatus.PENDING,
        paymentGateway: paymentMethod === PaymentMethod.SSLCOMMERZ ? "SSLCOMMERZ" : null,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.price,
            totalPrice: item.product.price * item.quantity,
          })),
        },
      },
      include: orderInclude,
    });

    await tx.cartItem.deleteMany({ where: { userId } });

    return createdOrder;
  });

  let payment: Record<string, unknown>;

  if (paymentMethod === PaymentMethod.SSLCOMMERZ) {
    const session = await initializeSslCommerzSession({
      orderId: order.id,
      userId,
      amount: order.totalAmount,
      customerName: "Customer",
      customerEmail: "customer@example.com",
      customerPhone: order.phone || "01700000000",
      shippingAddress: order.shippingAddress || undefined,
    });

    await prisma.paymentHistory.create({
      data: {
        orderId: order.id,
        userId,
        paymentMethod: order.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        paymentGateway: "SSLCOMMERZ",
        amount: order.totalAmount,
        gatewaySessionKey: session.sessionKey || null,
        gatewayResponse: toPrismaJson(session.gatewayResponse),
      },
    });

    payment = {
      paymentRequired: true,
      gateway: "SSLCOMMERZ",
      nextStep: "Redirect user to session.paymentUrl",
      session: {
        sessionKey: session.sessionKey,
        amount: order.totalAmount,
        currency: "BDT",
        paymentUrl: session.paymentUrl,
      },
    };
  } else {
    payment = {
      paymentRequired: false,
      nextStep: "Cash on Delivery selected",
    };
  }

  return {
    order,
    payment,
    pricing: {
      subtotal,
      deliveryFee,
      discountPercentage,
      discountAmount,
      totalAmount,
      appliedPromoCode: order.appliedPromoCode,
    },
  };
};

const initSslPayment = async (userId: string, orderId: string) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      ...orderInclude,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  if (order.paymentMethod !== PaymentMethod.SSLCOMMERZ) {
    throw new AppError(400, "This order is not configured for SSLCommerz payment");
  }

  if (order.paymentStatus === PaymentStatus.PAID) {
    throw new AppError(400, "Payment is already completed for this order");
  }

  if (order.status === OrderStatus.CANCELLED) {
    throw new AppError(400, "Cannot initialize payment for a cancelled order");
  }

  const session = await initializeSslCommerzSession({
    orderId: order.id,
    userId,
    amount: order.totalAmount,
    customerName: order.user?.name || "Customer",
    customerEmail: order.user?.email || "customer@example.com",
    customerPhone: order.phone || order.user?.phone || "01700000000",
    shippingAddress: order.shippingAddress || undefined,
  });

  await prisma.paymentHistory.create({
    data: {
      orderId: order.id,
      userId,
      paymentMethod: order.paymentMethod,
      paymentStatus: PaymentStatus.PENDING,
      paymentGateway: "SSLCOMMERZ",
      amount: order.totalAmount,
      gatewaySessionKey: session.sessionKey || null,
      gatewayResponse: toPrismaJson(session.gatewayResponse),
    },
  });

  return {
    order,
    gateway: "SSLCOMMERZ",
    session: {
      sessionKey: session.sessionKey,
      amount: order.totalAmount,
      currency: "BDT",
      paymentUrl: session.paymentUrl,
    },
  };
};

const markSslPaymentSuccess = async (
  orderId: string,
  transactionId: string,
  gatewayPayload?: GatewayPayload,
) => {
  const existingOrder = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      items: true,
    },
  });

  if (!existingOrder) {
    throw new AppError(404, "Order not found");
  }

  if (existingOrder.paymentMethod !== PaymentMethod.SSLCOMMERZ) {
    throw new AppError(400, "This order does not use SSLCommerz payment");
  }

  if (existingOrder.status === OrderStatus.CANCELLED) {
    throw new AppError(400, "Cannot complete payment for a cancelled order");
  }

  if (existingOrder.paymentStatus === PaymentStatus.PAID) {
    await prisma.paymentHistory.create({
      data: {
        orderId: existingOrder.id,
        userId: existingOrder.userId,
        paymentMethod: existingOrder.paymentMethod,
        paymentStatus: PaymentStatus.PAID,
        paymentGateway: "SSLCOMMERZ",
        amount: existingOrder.totalAmount,
        transactionId,
        paidAt: new Date(),
        gatewayResponse: toPrismaJson(gatewayPayload),
      },
    });

    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        ...orderInclude,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  return prisma.$transaction(async (tx) => {
    for (const item of existingOrder.items) {
      const stockUpdateResult = await tx.product.updateMany({
        where: {
          id: item.productId,
          status: STATUS.ACTIVE,
          stock: {
            gte: item.quantity,
          },
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      if (stockUpdateResult.count !== 1) {
        throw new AppError(400, "One or more products are out of stock");
      }
    }

    await tx.paymentHistory.updateMany({
      where: {
        orderId,
        paymentStatus: PaymentStatus.PENDING,
      },
      data: {
        paymentStatus: PaymentStatus.PAID,
        transactionId,
        paidAt: new Date(),
        gatewayResponse: toPrismaJson(gatewayPayload),
      },
    });

    await tx.paymentHistory.create({
      data: {
        orderId: existingOrder.id,
        userId: existingOrder.userId,
        paymentMethod: existingOrder.paymentMethod,
        paymentStatus: PaymentStatus.PAID,
        paymentGateway: "SSLCOMMERZ",
        amount: existingOrder.totalAmount,
        transactionId,
        paidAt: new Date(),
        gatewayResponse: toPrismaJson(gatewayPayload),
      },
    });

    return tx.order.update({
      where: {
        id: orderId,
      },
      data: {
        paymentStatus: PaymentStatus.PAID,
        transactionId,
        paidAt: new Date(),
        status: OrderStatus.CONFIRMED,
      },
      include: {
        ...orderInclude,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  });
};

const markSslPaymentFailed = async (orderId: string, gatewayPayload?: GatewayPayload) => {
  const existingOrder = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  if (!existingOrder) {
    throw new AppError(404, "Order not found");
  }

  if (existingOrder.paymentMethod !== PaymentMethod.SSLCOMMERZ) {
    throw new AppError(400, "This order does not use SSLCommerz payment");
  }

  if (existingOrder.paymentStatus === PaymentStatus.PAID) {
    throw new AppError(400, "Completed payments cannot be marked as failed");
  }

  return prisma.$transaction(async (tx) => {
    await tx.paymentHistory.updateMany({
      where: {
        orderId,
        paymentStatus: PaymentStatus.PENDING,
      },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        failedAt: new Date(),
        gatewayResponse: toPrismaJson(gatewayPayload),
      },
    });

    await tx.paymentHistory.create({
      data: {
        orderId: existingOrder.id,
        userId: existingOrder.userId,
        paymentMethod: existingOrder.paymentMethod,
        paymentStatus: PaymentStatus.FAILED,
        paymentGateway: "SSLCOMMERZ",
        amount: existingOrder.totalAmount,
        failedAt: new Date(),
        gatewayResponse: toPrismaJson(gatewayPayload),
      },
    });

    return tx.order.update({
      where: {
        id: orderId,
      },
      data: {
        paymentStatus: PaymentStatus.FAILED,
      },
      include: orderInclude,
    });
  });
};

const getMyOrders = async (userId: string, query: OrderQuery) => {
  const searchTerm =
    getQueryString(query.searchTerm)?.trim() ||
    getQueryString(query.search)?.trim() ||
    getQueryString(query.q)?.trim();
  const promoCodeTerm =
    getQueryString(query.promoCode)?.trim() ||
    getQueryString(query.appliedPromoCode)?.trim();
  const noteTerm = getQueryString(query.note)?.trim();
  const page = Math.max(getQueryNumber(query.page) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(getQueryNumber(query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;
  const sortByValue = getQueryString(query.sortBy) as SortableOrderField | undefined;
  const sortBy: SortableOrderField = sortableOrderFields.includes(sortByValue as SortableOrderField)
    ? (sortByValue as SortableOrderField)
    : "createdAt";
  const sortOrderInput = getQueryString(query.sortOrder)?.toLowerCase();
  const sortOrder: Prisma.SortOrder = sortOrderInput === "asc" ? "asc" : "desc";

  const where: Prisma.OrderWhereInput = {
    userId,
  };

  const status = getQueryString(query.status) as OrderStatus | undefined;
  if (status && Object.values(OrderStatus).includes(status)) {
    where.status = status;
  }

  const paymentStatus = getQueryString(query.paymentStatus) as PaymentStatus | undefined;
  if (paymentStatus && Object.values(PaymentStatus).includes(paymentStatus)) {
    where.paymentStatus = paymentStatus;
  }

  const paymentMethod = getQueryString(query.paymentMethod) as PaymentMethod | undefined;
  if (paymentMethod && Object.values(PaymentMethod).includes(paymentMethod)) {
    where.paymentMethod = paymentMethod;
  }

  if (promoCodeTerm) {
    where.OR = [
      {
        appliedPromoCode: {
          contains: promoCodeTerm,
          mode: "insensitive",
        },
      },
      {
        promoCode: {
          is: {
            code: {
              contains: promoCodeTerm,
              mode: "insensitive",
            },
          },
        },
      },
    ];
  }

  if (noteTerm) {
    where.note = {
      contains: noteTerm,
      mode: "insensitive",
    };
  }

  const minTotal = getQueryNumber(query.minTotal);
  const maxTotal = getQueryNumber(query.maxTotal);
  if (typeof minTotal === "number" || typeof maxTotal === "number") {
    where.totalAmount = {
      ...(typeof minTotal === "number" ? { gte: minTotal } : {}),
      ...(typeof maxTotal === "number" ? { lte: maxTotal } : {}),
    };
  }

  const fromDate = getQueryDate(query.fromDate);
  const toDate = getQueryDate(query.toDate);
  if (fromDate || toDate) {
    where.createdAt = {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDate ? { lte: toDate } : {}),
    };
  }

  if (searchTerm) {
    const orConditions: Prisma.OrderWhereInput[] = [
      {
        transactionId: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        appliedPromoCode: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        promoCode: {
          is: {
            code: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        },
      },
      {
        phone: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        shippingAddress: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        note: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
    ];

    if (isValidObjectId(searchTerm)) {
      orConditions.unshift({ id: searchTerm });
    }

    where.OR = orConditions;
  }

  const [data, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    meta: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    },
    data,
  };
};

const getAllOrders = async () => {
  return prisma.order.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      ...orderInclude,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};


const getAdminStats = async () => {
  const now = new Date();
  const dailyRangeStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29),
  );
  const monthlyRangeStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
  const yearlyRangeStart = new Date(Date.UTC(now.getUTCFullYear() - 4, 0, 1));

  const nonCancelledOrderFilter: Prisma.OrderWhereInput = {
    status: {
      not: OrderStatus.CANCELLED,
    },
  };

  const [
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenueAggregate,
    dailyOrders,
    monthlyOrders,
    yearlyOrders,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      where: nonCancelledOrderFilter,
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.order.findMany({
      where: {
        ...nonCancelledOrderFilter,
        createdAt: {
          gte: dailyRangeStart,
        },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    }),
    prisma.order.findMany({
      where: {
        ...nonCancelledOrderFilter,
        createdAt: {
          gte: monthlyRangeStart,
        },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    }),
    prisma.order.findMany({
      where: {
        ...nonCancelledOrderFilter,
        createdAt: {
          gte: yearlyRangeStart,
        },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    }),
  ]);

  const dailyLabels: string[] = [];
  for (let offset = 29; offset >= 0; offset -= 1) {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset),
    );
    dailyLabels.push(formatUtcDateLabel(date));
  }

  const monthlyLabels: string[] = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    monthlyLabels.push(formatUtcMonthLabel(date));
  }

  const yearlyLabels: string[] = [];
  for (let offset = 4; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear() - offset, 0, 1));
    yearlyLabels.push(formatUtcYearLabel(date));
  }

  return {
    overview: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: roundToTwo(totalRevenueAggregate._sum.totalAmount || 0),
    },
    charts: {
      dailyRevenue: buildRevenueSeries(dailyLabels, dailyOrders, formatUtcDateLabel),
      monthlyRevenue: buildRevenueSeries(monthlyLabels, monthlyOrders, formatUtcMonthLabel),
      yearlyRevenue: buildRevenueSeries(yearlyLabels, yearlyOrders, formatUtcYearLabel),
    },
  };
};
const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  const existingOrder = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      items: true,
    },
  });

  if (!existingOrder) {
    throw new AppError(404, "Order not found");
  }

  if (existingOrder.status === status) {
    return existingOrder;
  }

  if (existingOrder.status === OrderStatus.DELIVERED) {
    throw new AppError(400, "Delivered order status cannot be changed");
  }

  if (existingOrder.status === OrderStatus.CANCELLED) {
    throw new AppError(400, "Cancelled order status cannot be changed");
  }

  if (
    existingOrder.paymentMethod === PaymentMethod.SSLCOMMERZ &&
    existingOrder.paymentStatus !== PaymentStatus.PAID &&
    (status === OrderStatus.CONFIRMED ||
      status === OrderStatus.SHIPPED ||
      status === OrderStatus.DELIVERED)
  ) {
    throw new AppError(400, "Online payment is not completed for this order");
  }

  if (status === OrderStatus.CANCELLED) {
    const shouldRestoreStock =
      existingOrder.paymentMethod === PaymentMethod.COD ||
      existingOrder.paymentStatus === PaymentStatus.PAID;

    return prisma.$transaction(async (tx) => {
      if (shouldRestoreStock) {
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: {
              id: item.productId,
            },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      return tx.order.update({
        where: {
          id: orderId,
        },
        data: {
          status,
        },
        include: {
          ...orderInclude,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });
    });
  }

  return prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status,
    },
    include: {
      ...orderInclude,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });
};

export const orderService = {
  createOrderFromCart,
  initSslPayment,
  markSslPaymentSuccess,
  markSslPaymentFailed,
  getMyOrders,
  getAllOrders,
  getAdminStats,
  updateOrderStatus,
};












