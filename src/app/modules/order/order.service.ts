import { OrderStatus, PaymentMethod, PaymentStatus, PrismaClient, STATUS } from "@prisma/client";
import AppError from "../../helpers/AppError";

const prisma = new PrismaClient();

type CreateOrderPayload = {
  shippingAddress?: string;
  phone?: string;
  note?: string;
  deliveryFee?: number;
  paymentMethod?: PaymentMethod;
};

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
} as const;

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

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = payload.deliveryFee ?? 0;
  const totalAmount = subtotal + deliveryFee;

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

    const createdOrder = await tx.order.create({
      data: {
        userId,
        shippingAddress: payload.shippingAddress,
        phone: payload.phone,
        note: payload.note,
        subtotal,
        deliveryFee,
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

  const payment =
    paymentMethod === PaymentMethod.SSLCOMMERZ
      ? {
          paymentRequired: true,
          nextStep: "Call /api/v1/orders/:orderId/payments/ssl/init to initialize SSLCommerz session",
        }
      : {
          paymentRequired: false,
          nextStep: "Cash on Delivery selected",
        };

  return {
    order,
    payment,
  };
};

const initSslPayment = async (userId: string, orderId: string) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: orderInclude,
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

  const sessionKey = `SSL-${order.id.slice(-6)}-${Date.now()}`;

  return {
    order,
    gateway: "SSLCOMMERZ",
    session: {
      sessionKey,
      amount: order.totalAmount,
      currency: "BDT",
      // Placeholder URL. Replace with actual SSLCommerz gateway URL when credentials are added.
      paymentUrl: `https://sandbox.sslcommerz.com/mock/checkout?orderId=${order.id}&sessionKey=${sessionKey}`,
    },
  };
};

const markSslPaymentSuccess = async (orderId: string, transactionId: string) => {
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

const markSslPaymentFailed = async (orderId: string) => {
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

  return prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      paymentStatus: PaymentStatus.FAILED,
    },
    include: orderInclude,
  });
};

const getMyOrders = async (userId: string) => {
  return prisma.order.findMany({
    where: {
      userId,
    },
    include: orderInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
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
  updateOrderStatus,
};
