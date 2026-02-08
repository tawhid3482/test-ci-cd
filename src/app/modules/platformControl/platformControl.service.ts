import httpStatus from "http-status";
import { PrismaClient, Role } from "@prisma/client";


const prisma = new PrismaClient();

const addSubjects = async (payload: any) => {
  const result = await prisma.subjects.create({
    data: payload,
  });

  return result;
};
const addMediums = async (payload: any) => {
  const result = await prisma.medium.create({
    data: payload,
  });

  return result;
};
const addClasses = async (payload: any) => {
  const result = await prisma.classes.create({
    data: payload,
  });

  return result;
};

const getAllSubjects = async () => {
  const results = await prisma.subjects.findMany({
    orderBy: {
      name: "asc",
    },
  });
  return results;
};
const getAllMediums = async () => {
  const results = await prisma.medium.findMany({
    orderBy: {
      name: "asc",
    },
  });
  return results;
};

const getAllClasses = async () => {
  const results = await prisma.classes.findMany({
    orderBy: {
      name: "asc",
    },
  });
  return results;
};

export const platformControlService = {
  addSubjects,
  addClasses,
  addMediums,
  getAllClasses,
  getAllMediums,
  getAllSubjects
};
