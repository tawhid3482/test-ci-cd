import { PrismaClient } from "@prisma/client";
import AppError from "../../helpers/AppError";

const prisma = new PrismaClient();

const addToCart = async (userId: string, payload: { productId: string; quantity: number }) => {
  const product = await prisma.product.findFirst({
    where: {
      id: payload.productId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      stock: true,
    },
  });

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  if (payload.quantity > product.stock) {
    throw new AppError(400, "Requested quantity exceeds available stock");
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId: payload.productId,
      },
    },
  });

  if (existingItem) {
    const updatedQuantity = existingItem.quantity + payload.quantity;

    if (updatedQuantity > product.stock) {
      throw new AppError(400, "Requested quantity exceeds available stock");
    }

    return prisma.cartItem.update({
      where: {
        id: existingItem.id,
      },
      data: {
        quantity: updatedQuantity,
      },
      include: {
        product: true,
      },
    });
  }

  return prisma.cartItem.create({
    data: {
      userId,
      productId: payload.productId,
      quantity: payload.quantity,
    },
    include: {
      product: true,
    },
  });
};

const getMyCart = async (userId: string) => {
  const items = await prisma.cartItem.findMany({
    where: {
      userId,
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const summary = items.reduce(
    (acc, item) => {
      acc.totalItems += item.quantity;
      acc.totalPrice += item.product.price * item.quantity;
      return acc;
    },
    { totalItems: 0, totalPrice: 0 },
  );

  return {
    items,
    summary,
  };
};

const updateCartQuantity = async (userId: string, productId: string, quantity: number) => {
  const cartItem = await prisma.cartItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
    include: {
      product: {
        select: {
          stock: true,
        },
      },
    },
  });

  if (!cartItem) {
    throw new AppError(404, "Cart item not found");
  }

  if (quantity > cartItem.product.stock) {
    throw new AppError(400, "Requested quantity exceeds available stock");
  }

  return prisma.cartItem.update({
    where: {
      id: cartItem.id,
    },
    data: {
      quantity,
    },
    include: {
      product: true,
    },
  });
};

const removeFromCart = async (userId: string, productId: string) => {
  const cartItem = await prisma.cartItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  if (!cartItem) {
    throw new AppError(404, "Cart item not found");
  }

  return prisma.cartItem.delete({
    where: {
      id: cartItem.id,
    },
  });
};

export const cartService = {
  addToCart,
  getMyCart,
  updateCartQuantity,
  removeFromCart,
};
