import { PrismaClient, STATUS } from "@prisma/client";
import AppError from "../../helpers/AppError";

const prisma = new PrismaClient();

type ReviewPayload = {
  productId: string;
  rating?: string;
  comment?: string;
};

type ReviewQuery = Record<string, unknown>;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

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

const createReview = async (userId: string, payload: ReviewPayload) => {
  const product = await prisma.product.findFirst({
    where: {
      id: payload.productId,
      status: STATUS.ACTIVE,
    },
  });

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  const existingReview = await prisma.review.findFirst({
    where: {
      userId,
      productId: payload.productId,
    },
  });

  if (existingReview) {
    throw new AppError(409, "You already reviewed this product");
  }

  return prisma.review.create({
    data: {
      userId,
      productId: payload.productId,
      rating: payload.rating,
      comment: payload.comment,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          images: true,
        },
      },
    },
  });
};

const getProductReviews = async (productId: string, query: ReviewQuery) => {
  const page = Math.max(getQueryNumber(query.page) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(getQueryNumber(query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  const [data, total] = await prisma.$transaction([
    prisma.review.findMany({
      where: {
        productId,
      },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    }),
    prisma.review.count({
      where: {
        productId,
      },
    }),
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

const getMyReviews = async (userId: string, query: ReviewQuery) => {
  const page = Math.max(getQueryNumber(query.page) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(getQueryNumber(query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  const [data, total] = await prisma.$transaction([
    prisma.review.findMany({
      where: {
        userId,
      },
      skip,
      take: limit,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
          },
        },
      },
    }),
    prisma.review.count({
      where: {
        userId,
      },
    }),
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

const updateReview = async (userId: string, reviewId: string, payload: Omit<ReviewPayload, "productId">) => {
  const existingReview = await prisma.review.findFirst({
    where: {
      id: reviewId,
      userId,
    },
  });

  if (!existingReview) {
    throw new AppError(404, "Review not found");
  }

  return prisma.review.update({
    where: {
      id: reviewId,
    },
    data: {
      rating: payload.rating,
      comment: payload.comment,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          images: true,
        },
      },
    },
  });
};

const deleteReview = async (userId: string, reviewId: string) => {
  const existingReview = await prisma.review.findFirst({
    where: {
      id: reviewId,
      userId,
    },
  });

  if (!existingReview) {
    throw new AppError(404, "Review not found");
  }

  return prisma.review.delete({
    where: {
      id: reviewId,
    },
  });
};

export const reviewService = {
  createReview,
  getProductReviews,
  getMyReviews,
  updateReview,
  deleteReview,
};
