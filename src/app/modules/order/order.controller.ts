import { Request, Response } from "express";
import httpStatus from "http-status";
import { OrderStatus } from "@prisma/client";
import AppError from "../../helpers/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { orderService } from "./order.service";

const createOrderFromCart = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized access");
  }

  const result = await orderService.createOrderFromCart(req.user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Order placed successfully",
    data: result,
  });
});

const initSslPayment = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized access");
  }

  const orderId = req.params.orderId as string;
  const result = await orderService.initSslPayment(req.user.id, orderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SSLCommerz session initialized",
    data: result,
  });
});

const sslPaymentSuccess = catchAsync(async (req: Request, res: Response) => {
  const { orderId, transactionId } = req.body as { orderId: string; transactionId: string };

  const result = await orderService.markSslPaymentSuccess(orderId, transactionId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment marked as successful",
    data: result,
  });
});

const sslPaymentFail = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.body as { orderId: string };

  const result = await orderService.markSslPaymentFailed(orderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment marked as failed",
    data: result,
  });
});

const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized access");
  }

  const result = await orderService.getMyOrders(req.user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Orders retrieved successfully",
    data: result,
  });
});

const getAllOrders = catchAsync(async (_req: Request, res: Response) => {
  const result = await orderService.getAllOrders();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All orders retrieved successfully",
    data: result,
  });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string;
  const { status } = req.body as { status: OrderStatus };

  const result = await orderService.updateOrderStatus(orderId, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order status updated successfully",
    data: result,
  });
});

export const orderController = {
  createOrderFromCart,
  initSslPayment,
  sslPaymentSuccess,
  sslPaymentFail,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
};
