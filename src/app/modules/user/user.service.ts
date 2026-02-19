import { PrismaClient, Role, STATUS, EGender } from "@prisma/client";
import bcrypt from "bcrypt";
import AppError from "../../helpers/AppError";

const prisma = new PrismaClient();

type SignUpPayload = {
  name?: string;
  email: string;
  phone: string;
  password: string;
  gender?: EGender;
  avatar?: string;
  acceptTerms?: boolean;
};

const userSignUp = async (payload: SignUpPayload) => {
  const isUserExists = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (isUserExists) {
    throw new AppError(409, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(payload.password, 12);

  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: hashedPassword,
      gender: payload.gender,
      avatar: payload.avatar,
      acceptTerms: payload.acceptTerms ?? false,
      role: Role.USER,
      status: STATUS.ACTIVE,
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

const getMyProfile = async (user: { id: string }) => {
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
