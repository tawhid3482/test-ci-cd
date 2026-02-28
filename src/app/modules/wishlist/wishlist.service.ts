import { PrismaClient } from "@prisma/client";
import AppError from "../../helpers/AppError";

const prisma = new PrismaClient();

const addToWishlist = async (userId: string, productId: string) => {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      status: "ACTIVE",
    },
  });

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  const existingItem = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
    include: {
      product: true,
    },
  });

  if (existingItem) {
    return existingItem;
  }

  return prisma.wishlistItem.create({
    data: {
      userId,
      productId,
    },
    include: {
      product: true,
    },
  });
};

const getMyWishlist = async (userId: string) => {
  return prisma.wishlistItem.findMany({
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
};

const removeFromWishlist = async (userId: string, productId: string) => {
  const existingItem = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  if (!existingItem) {
    throw new AppError(404, "Wishlist item not found");
  }

  return prisma.wishlistItem.delete({
    where: {
      id: existingItem.id,
    },
  });
};

export const wishlistService = {
  addToWishlist,
  getMyWishlist,
  removeFromWishlist,
};
