import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ProductPayload = {
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  categoryId: string;
};

const createProduct = async (payload: ProductPayload) => {
  const product = await prisma.product.create({
    data: payload,
  });

  return product;
};

const getProduct = async () => {
  const result = await prisma.product.findMany({
    // where: {
    //   status: "ACTIVE",
    // },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

const getCategoryProduct = async () => {
  const result = await prisma.categories.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      image: true,
      products: {
        // where: {
        //   status: "ACTIVE",
        // },
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
      },
    },
  });

  return result;
};

const getSingleProduct = async (id: string) => {
  const result = await prisma.product.findFirst({
    where: {
      id,
      status: "ACTIVE",
    },
  });
  return result;
};

const updateProduct = async (id: string, payload: Partial<ProductPayload>) => {
  const result = await prisma.product.update({
    where: {
      id,
    },
    data: payload,
  });

  return result;
};

const deleteProduct = async (id: string) => {
  const result = await prisma.product.update({
    where: {
      id,
    },
    data: {
      status: "INACTIVE",
    },
  });

  return result;
};

export const ProductService = {
  createProduct,
  getProduct,
  getCategoryProduct,
  updateProduct,
  getSingleProduct,
  deleteProduct,
};
