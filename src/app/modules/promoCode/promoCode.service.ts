import { PromoCode, PrismaClient, STATUS } from "@prisma/client";
import AppError from "../../helpers/AppError";

const prisma = new PrismaClient();

const normalizeCode = (code: string) => code.trim().toUpperCase();
const roundToTwo = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const toPromoData = (payload: Record<string, unknown>) => {
  const data: Record<string, unknown> = { ...payload };

  if (typeof data.code === "string") {
    data.code = normalizeCode(data.code);
  }

  if (typeof data.startsAt === "string") {
    data.startsAt = new Date(data.startsAt);
  }

  if (typeof data.expiresAt === "string") {
    data.expiresAt = new Date(data.expiresAt);
  }

  if (data.startsAt === null) {
    data.startsAt = null;
  }

  if (data.expiresAt === null) {
    data.expiresAt = null;
  }

  if (data.usageLimit === null) {
    data.usageLimit = null;
  }

  return data;
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

const createPromoCode = async (payload: Record<string, unknown>) => {
  const data = toPromoData(payload);

  return prisma.promoCode.create({
    data: data as never,
  });
};

const getPromoCodes = async () => {
  return prisma.promoCode.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

const updatePromoCode = async (promoCodeId: string, payload: Record<string, unknown>) => {
  const existingPromo = await prisma.promoCode.findUnique({
    where: {
      id: promoCodeId,
    },
  });

  if (!existingPromo) {
    throw new AppError(404, "Promo code not found");
  }

  const data = toPromoData(payload);

  return prisma.promoCode.update({
    where: {
      id: promoCodeId,
    },
    data: data as never,
  });
};

const deletePromoCode = async (promoCodeId: string) => {
  const existingPromo = await prisma.promoCode.findUnique({
    where: {
      id: promoCodeId,
    },
  });

  if (!existingPromo) {
    throw new AppError(404, "Promo code not found");
  }

  return prisma.promoCode.delete({
    where: {
      id: promoCodeId,
    },
  });
};

const applyPromoCodeToCart = async (userId: string, payload: { promoCode: string; deliveryFee?: number }) => {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          price: true,
          stock: true,
          status: true,
        },
      },
    },
  });

  if (!cartItems.length) {
    throw new AppError(400, "Cart is empty");
  }

  for (const item of cartItems) {
    if (item.product.status !== STATUS.ACTIVE) {
      throw new AppError(400, "One or more products are not available right now");
    }

    if (item.quantity > item.product.stock) {
      throw new AppError(400, "One or more products have insufficient stock");
    }
  }

  const normalizedCode = normalizeCode(payload.promoCode);
  const promo = await prisma.promoCode.findUnique({
    where: {
      code: normalizedCode,
    },
  });

  if (!promo) {
    throw new AppError(400, "Invalid promo code");
  }

  const subtotal = roundToTwo(cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0));
  const deliveryFee = roundToTwo(payload.deliveryFee ?? 0);

  validatePromoEligibility(promo, subtotal, new Date());

  const discountAmount = roundToTwo((subtotal * promo.discountPercentage) / 100);
  const totalAmount = roundToTwo(Math.max(0, subtotal + deliveryFee - discountAmount));

  return {
    promo: {
      id: promo.id,
      code: promo.code,
      discountPercentage: promo.discountPercentage,
    },
    pricing: {
      subtotal,
      deliveryFee,
      discountPercentage: promo.discountPercentage,
      discountAmount,
      totalAmount,
    },
  };
};

export const promoCodeService = {
  createPromoCode,
  getPromoCodes,
  updatePromoCode,
  deletePromoCode,
  applyPromoCodeToCart,
};
