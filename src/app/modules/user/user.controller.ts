import { Request, Response } from "express";
import httpStatus from "http-status";
import AppError from "../../helpers/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { userService } from "./user.service";

const userSignUp = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.userSignUp(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User SignUp  successfully",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getAllUsers();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All Users retrieved successfully",
    data: result,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized access");
  }

  const result = await userService.getMyProfile({ id: req.user.id });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My Profile retrieved successfully",
    data: result,
  });
});

export const userController = {
  userSignUp,
  getAllUsers,
  getMyProfile,
};
