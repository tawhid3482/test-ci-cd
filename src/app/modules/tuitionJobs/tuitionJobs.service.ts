import httpStatus from "http-status";
import { PrismaClient, Role } from "@prisma/client";
import { generateJobId } from "./tuitionJobs.generateId";

const prisma = new PrismaClient();

const createTuitionJobs = async (payload: any) => {

  const jobs_id = await generateJobId();

  const result = await prisma.tuitionJobs.create({
    data: {
      ...payload,
      jobs_id,
    },
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
