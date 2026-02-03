import { Response } from "express";

export interface AuthToken {
  accessToken?: string;
  refreshToken?: string;
}

const isProd = process.env.NODE_ENV === "production";

export const setAuthCookie = (res: Response, tokenInfo: AuthToken) => {
  if (tokenInfo.accessToken) {
    res.cookie("accessToken", tokenInfo.accessToken, {
      httpOnly: true,
      secure: isProd ? true : false,
      sameSite:isProd ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
      // maxAge: 1000 * 60

    });
  }

  if (tokenInfo.refreshToken) {
    res.cookie("refreshToken", tokenInfo.refreshToken, {
      httpOnly: true,
      secure: isProd ? true : false,
      sameSite: isProd ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days

    });
  }
};