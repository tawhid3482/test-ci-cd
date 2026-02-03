import httpStatus from "http-status";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { generateStudentId, generateTutorId } from "./generateId";
import AppError from "../../helpers/AppError";

const prisma = new PrismaClient();

const userSignUp = async (payload: any) => {
  const isUserExits = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });
  if (isUserExits) {
    throw new AppError(404, "User Already exits");
  }
  const hashedPassword = await bcrypt.hash(payload.password, 12);
  const result = await prisma.$transaction(async (tx:any) => {
    const user = await tx.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        phone: payload.phone,
        role: payload.role,
        gender: payload.gender,
      },
    });

    if (payload.role === Role.TUTOR) {
      await tx.tutor.create({
        data: {
          userId: user.id,
          tutor_id: await generateTutorId(payload.gender),
          district: payload.district,
          thana: payload.thana,
          area: [],
          background: [],
          skills: [],
          classes: [],
          medium: [],
          subjects: [],
          availability_days: [],
          available_time: [],
        },
      });
    }

    if (payload.role === Role.STUDENT) {
      await tx.student.create({
        data: {
          userId: user.id,
          student_id: await generateStudentId(),
        },
      });
    }

    const { password, ...safeUser } = user;

    return safeUser;
  });

  return result;
};

const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    orderBy:{
      createdAt:"desc"
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
  getAllUsers
};
