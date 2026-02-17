import httpStatus from "http-status";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import AppError from "../../helpers/AppError";

const prisma = new PrismaClient();

const userSignUp = async (payload: any) => {
  const isUserExists = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (isUserExists) {
    throw new AppError(409, "User already exists");
  }
  const hashedPassword = await bcrypt.hash(payload.password, 12);
  const user = await prisma.user.create({
    data: {
      ...payload,
      password: hashedPassword,
    },
  });
  const { password, ...safeUser } = user;
  return safeUser;
};

const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      gender: true,
      createdAt: true,
    },
  });
  return users;
};



const getMyProfile = async (user: any) => {
  const users = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      gender: true,
      createdAt: true,
    },
  });
  return users;
};

export const userService = {
  userSignUp,
  getAllUsers,
  getMyProfile,
};
