import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { districtService } from "./district.service";

const createDistrict = catchAsync(async (req: Request, res: Response) => {
  const result = await districtService.createDistrict(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "district created  successfully",
    data: result,
  });
});
const getAllDistricts = catchAsync(async (req: Request, res: Response) => {
  const result = await districtService.getAllDistricts();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All districts retrieved successfully",
    data: result,
  });
});

export const districtController = {
  createDistrict,
  getAllDistricts,
};
