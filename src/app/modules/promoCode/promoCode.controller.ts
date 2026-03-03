import { Request, Response } from "express";
import httpStatus from "http-status";
import { Prisma } from "@prisma/client";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import AppError from "../../helpers/AppError";
import { promoCodeService } from "./promoCode.service";

const createPromoCode = catchAsync(async (req: Request, res: Response) => {
  try {
    const result = await promoCodeService.createPromoCode(req.body as Record<string, unknown>);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Promo code created successfully",
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(httpStatus.BAD_REQUEST, "Promo code already exists");
    }

    throw error;
  }
});

const getPromoCodes = catchAsync(async (_req: Request, res: Response) => {
  const result = await promoCodeService.getPromoCodes();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Promo codes retrieved successfully",
    data: result,
  });
});

const updatePromoCode = catchAsync(async (req: Request, res: Response) => {
  const promoCodeId = req.params.promoCodeId as string;

  try {
    const result = await promoCodeService.updatePromoCode(
      promoCodeId,
      req.body as Record<string, unknown>,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Promo code updated successfully",
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(httpStatus.BAD_REQUEST, "Promo code already exists");
    }

    throw error;
  }
});

const deletePromoCode = catchAsync(async (req: Request, res: Response) => {
  const promoCodeId = req.params.promoCodeId as string;

  const result = await promoCodeService.deletePromoCode(promoCodeId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Promo code deleted successfully",
    data: result,
  });
});

const applyPromoCode = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized access");
  }

  const result = await promoCodeService.applyPromoCodeToCart(req.user.id, req.body as { promoCode: string; deliveryFee?: number });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Promo code applied successfully",
    data: result,
  });
});

export const promoCodeController = {
  createPromoCode,
  getPromoCodes,
  updatePromoCode,
  deletePromoCode,
  applyPromoCode,
};
