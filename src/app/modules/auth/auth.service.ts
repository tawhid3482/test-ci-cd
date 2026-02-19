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

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid credentials");
  }

  const isPasswordMatch = await bcrypt.compare(password!, user.password);
  if (!isPasswordMatch) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid credentials");
  }

  const userTokens = createUserToken(user);
  const { password: _, ...rest } = user;

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
  token: string;
  newPassword: string;
}) => {
  let decoded: JwtPayload;

  try {
    decoded = jwt.verify(
      payload.token,
      envVars.JWT_ACCESS_SECRET,
    ) as JwtPayload;
  } catch {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid or expired reset token");
  }

  const userId = decoded.userId as string | undefined;
  const email = decoded.email as string | undefined;

  if (!userId || !email) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid reset payload");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.email !== email) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid or expired reset token");
  }

  const hashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(envVars.BCRYPT_SALT_ROUND),
  );

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};

const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Avoid user enumeration through response behavior.
  if (!user || ["SUSPENDED", "INACTIVE"].includes(user.status)) {
    return;
  }

  const resetToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    envVars.JWT_ACCESS_SECRET,
    { expiresIn: "10m" },
  );

  const resetUILink = `${envVars.FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;

  const html = `<p>Click the link below to reset your password. This link expires in 10 minutes.</p><p><a href="${resetUILink}">Reset Password</a></p>`;

  await sendEmail(user.email, "Password Reset", html);
};

const changePassword = async (
  oldPassword: string,
  newPassword: string,
  decodedToken: JwtPayload,
) => {
  const user = await prisma.user.findUnique({
    where: { id: decodedToken.id as string },
  });

  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not found");
  }

  const isOldPasswordMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isOldPasswordMatch) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Old password does not match");
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new AppError(httpStatus.BAD_REQUEST, "New password must be different");
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(envVars.BCRYPT_SALT_ROUND),
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });
};

const getSession = async (token: string) => {
  const normalizedToken = token.startsWith("Bearer ")
    ? token.split(" ")[1]
    : token;

  const decoded = jwt.verify(
    normalizedToken,
    envVars.JWT_ACCESS_SECRET as string,
  ) as JwtPayload;

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      email: true,
      avatar: true,
      role: true,
      name: true,
      status: true,
    },
  });

  return user;
};

export const authService = {
  userLogin,
  getNewAccessToken,
  resetPassword,
  changePassword,
  forgotPassword,
  getSession,
};
