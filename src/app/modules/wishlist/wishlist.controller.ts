import { Request, Response } from "express";
import httpStatus from "http-status";
import AppError from "../../helpers/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { wishlistService } from "./wishlist.service";

const addToWishlist = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized access");
  }

  const result = await wishlistService.addToWishlist(req.user.id, req.body.productId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product added to wishlist successfully",
    data: result,
  });
});

const getMyWishlist = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized access");
  }

  const result = await wishlistService.getMyWishlist(req.user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Wishlist retrieved successfully",
    data: result,
  });
});

const removeFromWishlist = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized access");
  }

  const productId = req.params.productId as string;
  const result = await wishlistService.removeFromWishlist(req.user.id, productId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product removed from wishlist successfully",
    data: result,
  });
});

export const wishlistController = {
  addToWishlist,
  getMyWishlist,
  removeFromWishlist,
};
