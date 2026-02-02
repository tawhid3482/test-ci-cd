import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

import { contactService } from "./contact.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";


const createContact = catchAsync(async (req: Request, res: Response) => {
  const result = await contactService.createContact(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Contact Message created successfully",
    data: result,
  });
});

const getContact = catchAsync(async (req: Request, res: Response) => {
  const result = await contactService.getContact();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Contact Message retrieved successfully",
    data: result,
  });
});


export const contactController = {
createContact,
getContact,
};
