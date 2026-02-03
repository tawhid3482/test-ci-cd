import { Request, Response } from "express";
import httpStatus from "http-status";

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



export const userController = {
userSignUp,
getAllUsers
};