import httpStatus from "http-status";
import { PrismaClient } from "@prisma/client";
import { generateOTP } from "../../utils/otpGenerate";
import { sendOtpTemplate } from "../../utils/sendOtpTemplete";
import sendEmail from "../../utils/sendEmail";
import AppError from "../../helpers/AppError";

const prisma = new PrismaClient();

const sendOTP = async (payload: { email: string; name: string }) => {
  const isUserExist = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User already exists");
  }

  await prisma.oTP.deleteMany({ where: { email: payload.email } });
  const { email, name } = payload;
  const otp = generateOTP();
  await prisma.$transaction([
    prisma.oTP.create({
      data: {
        email,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    }),
  ]);

  const { subject, html } = sendOtpTemplate({
    name,
    otp,
    expiresIn: "5 minutes",
  });

  sendEmail(email, subject, html).catch(console.error);

  return;
};

const verifyOTP = async (payload: { email: string; otp: string }) => {
  const record = await prisma.oTP.findFirst({
    where: {
      email: payload.email,
      otp: payload.otp,
      expiresAt: {
        gte: new Date(),
      },
    },
  });

  if (!record) {
    throw {
      status: httpStatus.BAD_REQUEST,
      message: "Invalid or expired OTP",
    };
  }

  await prisma.oTP.delete({
    where: { id: record.id },
  });
  await prisma.oTP.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  return;
};

const resendOTP = async (payload: { email: string; name: string }) => {
  await prisma.oTP.deleteMany({ where: { email: payload.email } });
  const otp = generateOTP();
  await prisma.oTP.create({
    data: {
      email: payload.email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  const { subject, html } = sendOtpTemplate({
    name: payload.name,
    otp,
    expiresIn: "5 minutes",
  });

  await sendEmail(payload.email, subject, html);

  return;
};

export const OTPService = {
  sendOTP,
  verifyOTP,
  resendOTP,
};
