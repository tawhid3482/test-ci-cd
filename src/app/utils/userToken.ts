import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env";
import httpStatus from "http-status";
import { PrismaClient } from "@prisma/client";
import { generateToken, verifyToken } from "./jwt";
import AppError from "../helpers/AppError";

const prisma = new PrismaClient();

export const createUserToken = (user: any) => {
  const jwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateToken(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET,
    envVars.JWT_EXPIRES_IN,
  );
  const refreshToken = generateToken(
    jwtPayload,
    envVars.JWT_REFRESH_SECRET,
    envVars.JWT_REFRESH_EXPIRED,
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const createNewAccessTokenWithRefreshToken = async (
  refreshToken: string,
) => {
  const verifiedRefreshToken = verifyToken(
    refreshToken,
    envVars.JWT_REFRESH_SECRET,
  ) as JwtPayload;

  const isUserExist = await prisma.user.findUnique({
    where: { email: verifiedRefreshToken.email },
  });

  if (!isUserExist) {
    throw new AppError(httpStatus.CONFLICT, "User does not exist");
  }

  if (isUserExist.status === "INACTIVE" || isUserExist.status === "SUSPENDED") {
    throw new AppError(httpStatus.CONFLICT, `User is ${isUserExist.status === "INACTIVE"}`);
  }

  const jwtPayload = {
    id: isUserExist.id,
    email: isUserExist.email,
    role: isUserExist.role,
  };

  const accessToken = generateToken(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET,
    envVars.JWT_EXPIRES_IN,
  );

  return accessToken;
};
