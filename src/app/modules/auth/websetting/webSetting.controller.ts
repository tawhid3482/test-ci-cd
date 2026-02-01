import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import { webSettingService } from "./webSetting.service";


const createWebSetting = catchAsync(async (req: Request, res: Response) => {
   await webSettingService.createWebSetting(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Web setting created successfully",
    data: null,
  });
});

const getWebSetting = catchAsync(async (req: Request, res: Response) => {
  const result = await webSettingService.getWebSetting();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Web setting retrieved successfully",
    data: result,
  });
});


export const webSettingController = {
createWebSetting,
getWebSetting,
};
