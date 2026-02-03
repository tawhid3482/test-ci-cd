import httpStatus from "http-status";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { envVars } from "../../config/env";
import {
  createNewAccessTokenWithRefreshToken,
  createUserToken,
} from "../../utils/userToken";
import sendEmail from "../../utils/sendEmail";
import AppError from "../../helpers/AppError";

const prisma = new PrismaClient();

const userLogin = async (
  payload: Partial<{ email: string; password: string }>,
) => {
  const { email, password } = payload;

  const isUserExist = await prisma.user.findUnique({ where: { email } });
  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User does not exist");
  }
  const isPasswordMatch = await bcrypt.compare(password!, isUserExist.password);
  if (!isPasswordMatch) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Incorrect password");
  }

  const userTokens = createUserToken(isUserExist);

  const { password: _, ...rest } = isUserExist;
  return {
    accessToken: userTokens.accessToken,
    refreshToken: userTokens.refreshToken,
    user: rest,
  };
};

const getNewAccessToken = async (refreshToken: string) => {
  const newAccessToken =
    await createNewAccessTokenWithRefreshToken(refreshToken);
  return { accessToken: newAccessToken };
};

const resetPassword = async (payload: {
  email: string;
  newPassword: string;
}) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (!user) throw { status: 401, message: "User does not exist" };
  if (user.status === "SUSPENDED")
    throw { status: 401, message: "User already deleted" };

  const hashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(envVars.BCRYPT_SALT_ROUND),
  );

  await prisma.user.update({
    where: { email: payload.email },
    data: { password: hashedPassword },
  });
};

const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    throw { status: httpStatus.BAD_REQUEST, message: "User does not exist" };
  if (["SUSPENDED", "INACTIVE"].includes(user.status))
    throw {
      status: httpStatus.BAD_REQUEST,
      message: `User is ${user.status}`,
    };

  const resetToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    envVars.JWT_ACCESS_SECRET,
    { expiresIn: "10m" },
  );

  const resetUILink = `${envVars.FRONTEND_URL}/reset-password?id=${user.id}&token=${resetToken}`;

  // await sendEmail({
  //   to: user.email,
  //   subject: "Password Reset",
  //   templateName: "forgetPassword",
  //   templateData: { role: user.role, resetUILink },
  // });
};

const changePassword = async (
  oldPassword: string,
  newPassword: string,
  decodedToken: JwtPayload,
) => {
  const user = await prisma.user.findUnique({
    where: { id: decodedToken.id as string },
  });
  if (!user)
    throw { status: httpStatus.UNAUTHORIZED, message: "User not found" };

  const isOldPasswordMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isOldPasswordMatch)
    throw {
      status: httpStatus.UNAUTHORIZED,
      message: "Old password does not match",
    };

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(envVars.BCRYPT_SALT_ROUND),
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });
};

export const authService = {
  userLogin,
  getNewAccessToken,
  resetPassword,
  changePassword,
  forgotPassword,
};
