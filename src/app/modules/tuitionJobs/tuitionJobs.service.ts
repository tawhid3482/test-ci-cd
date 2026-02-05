import httpStatus from "http-status";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const createTuitionJobs = async (payload: any) => {
  const result = await prisma.tuitionJobs.create({
    data: payload,
  });

  return result;
};

const getAllTuitionJobs = async () => {
  const tuitionJobs = await prisma.tuitionJobs.findMany({
    where: {
      status: "Active",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return tuitionJobs;
};

export const tuitionJobsService = {
  createTuitionJobs,
  getAllTuitionJobs,
};
