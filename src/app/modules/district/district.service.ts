import httpStatus from "http-status";
import { PrismaClient, Role } from "@prisma/client";


const prisma = new PrismaClient();

const createDistrict = async (payload: any) => {
  const result = await prisma.district.create({
    data: payload,
  });

  return result;
};

const getAllDistricts = async () => {
  const districts = await prisma.district.findMany({
    orderBy: {
      name: "asc",
    },
  });
  return districts;
};

export const districtService = {
  createDistrict,
  getAllDistricts,
};
