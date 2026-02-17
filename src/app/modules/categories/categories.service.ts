import httpStatus from "http-status";
import { PrismaClient } from "@prisma/client";
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
    orderBy: {
      createdAt: "desc",
    },
  });
  return result;
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
