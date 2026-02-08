import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { platformControlService } from "./platformControl.service";

const addSubjects = catchAsync(async (req: Request, res: Response) => {
  const result = await platformControlService.addSubjects(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subject added  successfully",
    data: result,
  });
});

const addMediums = catchAsync(async (req: Request, res: Response) => {
  const result = await platformControlService.addMediums(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Medium added  successfully",
    data: result,
  });
});

const addClasses = catchAsync(async (req: Request, res: Response) => {
  const result = await platformControlService.addClasses(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Classes added  successfully",
    data: result,
  });
});

const getAllSubjects = catchAsync(async (req: Request, res: Response) => {
  const result = await platformControlService.getAllSubjects();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All Subjects retrieved successfully",
    data: result,
  });
});

const getAllMediums = catchAsync(async (req: Request, res: Response) => {
  const result = await platformControlService.getAllMediums();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All Mediums retrieved successfully",
    data: result,
  });
});

const getAllClasses = catchAsync(async (req: Request, res: Response) => {
  const result = await platformControlService.getAllClasses();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All Classes retrieved successfully",
    data: result,
  });
});

export const platformControlController = {
  addSubjects,
  addClasses,
  addMediums,
  getAllSubjects,
  getAllMediums,
  getAllClasses,
};
