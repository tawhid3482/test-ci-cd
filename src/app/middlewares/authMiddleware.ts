import { JwtPayload, verify } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { envVars } from "../config/env";
import AppError from "../helpers/AppError";
import { Role } from "@prisma/client";

interface CustomJwtPayload extends JwtPayload {
  id: string;
  phone: string;
  role: Role;
}

export const auth = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(new AppError(401, "Unauthorized access", "No token provided"));
    }

    // Expect: "Bearer token"
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    if (!token) {
      return next(new AppError(401, "Unauthorized access", "No token provided"));
    }

    try {
      const secret = envVars.JWT_ACCESS_SECRET;
      if (!secret) {
        return next(new AppError(500, "Internal Server Error", "JWT secret not configured"));
      }

      const decoded = verify(token, secret) as unknown as CustomJwtPayload;

      if (roles.length && !roles.includes(decoded.role)) {
        return next(new AppError(403, "Forbidden", "You are not allowed"));
      }

      req.user = decoded;
      next();
    } catch (error) {
      return next(new AppError(401, "Unauthorized access", "Invalid token"));
    }
  };
};