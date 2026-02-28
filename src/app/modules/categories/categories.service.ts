import httpStatus from "http-status";
import { PrismaClient, STATUS } from "@prisma/client";
import sendEmail from "../../utils/sendEmail";
import { envVars } from "../../config/env";

const prisma = new PrismaClient();

const createCategory = async (payload: any) => {
  const Category = await prisma.categories.create({
    data: payload,
  });

  return Category;
};

const getCategory = async () => {
  const result = await prisma.categories.findMany({
    where: {
      status: STATUS.ACTIVE,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      image: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          products: {
            where: {
              status: STATUS.ACTIVE,
            },
          },
        },
      },
    },
  });

  return result.map(({ _count, ...category }) => ({
    ...category,
    activeProductCount: _count.products,
  }));
};

const updateCategory = async (id: string, payload: any) => {
  const result = await prisma.categories.update({
    where: {
      id,
    },
    data: payload,
  });
  return result;
};
const deleteCategory = async (id: string) => {
  const result = await prisma.categories.delete({
    where: {
      id,
    },
  });
  return result;
};

export const CategoryService = {
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
};

