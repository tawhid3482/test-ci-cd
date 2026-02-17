import httpStatus from "http-status";
import { PrismaClient } from "@prisma/client";
import sendEmail from "../../utils/sendEmail";
import { envVars } from "../../config/env";

const prisma = new PrismaClient();

const createProduct = async (payload: any) => {
  const Product = await prisma.categories.create({
    data: payload,
  });

  return Product;
};

const getProduct = async () => {
  const result = await prisma.categories.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  return result;
};
const getSingleProduct = async (id:string) => {
  const result = await prisma.categories.findUnique({
    where: {
      id
    },
  });
  return result;
};

const updateProduct = async (id: string, payload: any) => {
  const result = await prisma.categories.update({
    where: {
      id,
    },
    data: payload,
  });
  return result;
};
const deleteProduct = async (id: string) => {
  const result = await prisma.categories.delete({
    where: {
      id,
    },
  });
  return result;
};

export const ProductService = {
  createProduct,
  getProduct,
  updateProduct,
  getSingleProduct,
  deleteProduct,
};
