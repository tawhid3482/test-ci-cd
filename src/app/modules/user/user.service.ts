import httpStatus from "http-status";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { generateStudentId, generateTutorId } from "./generateId";
import AppError from "../../helpers/AppError";

const prisma = new PrismaClient();

const userSignUp = async (payload: any) => {
  const isUserExits = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (isUserExits) {
    throw new AppError(409, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(payload.password, 12);

  // 🔥 heavy logic BEFORE transaction
  let tutorId: string | null = null;
  let studentId: string | null = null;

  if (payload.role === Role.TUTOR) {
    tutorId = await generateTutorId(payload.gender);
  }

  if (payload.role === Role.STUDENT) {
    studentId = await generateStudentId();
  }

  const result = await prisma.$transaction(async (tx: any) => {
    const user = await tx.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        phone: payload.phone || null,
        role: payload.role,
        gender: payload.gender,
      },
    });

    if (payload.role === Role.TUTOR && tutorId) {
      await tx.tutor.create({
        data: {
          userId: user.id,
          tutor_id: tutorId,
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

    if (payload.role === Role.STUDENT && studentId) {
      await tx.student.create({
        data: {
          userId: user.id,
          student_id: studentId,
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

const getAllDistrictTutors = async () => {
  const result = await prisma.tutor.groupBy({
    by: ["district"],
    where: {
      district: {
        not: null,
      },
    },
    _count: {
      _all: true,
    },
  });

  // response format transform
  return result.map((item) => ({
    town: item.district,
    count: item._count._all,
  }));
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
  getAllDistrictTutors
};
