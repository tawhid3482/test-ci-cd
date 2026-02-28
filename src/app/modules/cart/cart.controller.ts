import { Request, Response } from "express";
import httpStatus from "http-status";
import AppError from "../../helpers/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { cartService } from "./cart.service";

const addToCart = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized access");
  }

  const result = await cartService.addToCart(req.user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product added to cart successfully",
    data: result,
  });
});

const getMyCart = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized access");
  }

  const result = await cartService.getMyCart(req.user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cart retrieved successfully",
    data: result,
  });
});

const updateCartQuantity = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized access");
  }

  const productId = req.params.productId as string;
  const result = await cartService.updateCartQuantity(req.user.id, productId, req.body.quantity);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cart quantity updated successfully",
    data: result,
  });
});

const removeFromCart = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized access");
  }

  const productId = req.params.productId as string;
  const result = await cartService.removeFromCart(req.user.id, productId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product removed from cart successfully",
    data: result,
  });
});

export const cartController = {
  addToCart,
  getMyCart,
  updateCartQuantity,
  removeFromCart,
};
