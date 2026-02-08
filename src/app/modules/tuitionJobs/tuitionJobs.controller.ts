import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { tuitionJobsService } from "./tuitionJobs.service";

const createTuitionJobs = catchAsync(async (req: Request, res: Response) => {
  const result = await tuitionJobsService.createTuitionJobs(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "tuition Jobs created  successfully",
    data: result,
  });
});

const getAllTuitionJobs = catchAsync(async (req: Request, res: Response) => {
  const result = await tuitionJobsService.getAllTuitionJobs();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All tuitionJobs retrieved successfully",
    data: result,
  });
});

export const tuitionJobsController = {
  createTuitionJobs,
  getAllTuitionJobs,
};
