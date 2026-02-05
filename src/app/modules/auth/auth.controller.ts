/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { authService } from "./auth.service";
import httpStatus from "http-status";
import { setAuthCookie } from "../../utils/setCookie";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import AppError from "../../helpers/AppError";
import { OTPService } from "./otp.service";

const sendOtp = catchAsync(async (req: Request, res: Response) => {
  await OTPService.sendOTP(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "send to the opt you mail successful",
    data: null,
  });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await OTPService.verifyOTP(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "verify otp successfully",
    data: result,
  });
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  await OTPService.resendOTP(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "resend the otp successfully",
    data: null,
  });
});

const userLogin = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.userLogin(req.body);
  setAuthCookie(res, result);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: result,
  });
});

const getNewAccessToken = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError(httpStatus.BAD_REQUEST, "Login again");
  }

  const tokenInfo = await authService.getNewAccessToken(refreshToken as string);

  setAuthCookie(res, tokenInfo);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New Access token got successfully",
    data: tokenInfo,
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: false,
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logout successfully",
    data: null,
  });
});

const changePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const newPassword = req.body.newPassword;
    const oldPassword = req.body.oldPassword;
    const decodedToken = req.user;

    await authService.changePassword(
      oldPassword,
      newPassword,
      decodedToken as JwtPayload,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password Changed Successfully",
      data: null,
    });
  },
);

const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await authService.resetPassword(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password Reset Successfully",
      data: null,
    });
  },
);

const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    await authService.forgotPassword(email);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Email Sent Successfully",
      data: null,
    });
  },
);

const getSession = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "No active session",
      data: {
        isAuthenticated: false,
        user: null,
      },
    });
    return;
  }

  try {
    const user = await authService.getSession(token as string);
    if (!user) {
      sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Invalid session",
        data: {
          isAuthenticated: false,
          user: null,
        },
      });
      return;
    }

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Session retrieved successfully",
      data: {
        isAuthenticated: true,
        user,
      },
    });
  } catch {
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Session expired",
      data: {
        isAuthenticated: false,
        user: null,
      },
    });
  }
});

export const authController = {
  userLogin,
  getNewAccessToken,
  logout,
  resetPassword,
  changePassword,
  forgotPassword,
  sendOtp,
  resendOtp,
  getSession,
  verifyOtp,
};
