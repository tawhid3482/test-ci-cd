import { NextFunction, Request, Response } from "express";

const createRateLimiter = (windowMs: number, maxRequests: number) => {
  const requestLog = new Map<string, { count: number; windowStart: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const existing = requestLog.get(key);

    if (!existing || now - existing.windowStart > windowMs) {
      requestLog.set(key, { count: 1, windowStart: now });
      return next();
    }

    if (existing.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: "Too many requests, please try again later.",
      });
    }

    existing.count += 1;
    requestLog.set(key, existing);
    return next();
  };
};

export const apiRateLimiter = createRateLimiter(15 * 60 * 1000, 1000);
export const authRateLimiter = createRateLimiter(15 * 60 * 1000, 50);
