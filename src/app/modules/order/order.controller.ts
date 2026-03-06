import { Request, Response } from "express";
import httpStatus from "http-status";
import { OrderStatus } from "@prisma/client";
import AppError from "../../helpers/AppError";
import { envVars } from "../../config/env";
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

const getSslPayload = (req: Request): Record<string, unknown> => ({
  ...(req.query as Record<string, unknown>),
  ...(req.body as Record<string, unknown>),
});

const buildFrontendRedirectUrl = (
  path: string,
  params: Record<string, string | undefined>,
): string => {
  const url = new URL(path, envVars.FRONTEND_URL);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
};

const sslPaymentSuccess = catchAsync(async (req: Request, res: Response) => {
  const payload = getSslPayload(req);
  const orderId = String(payload.orderId ?? payload.value_a ?? "").trim();
  const transactionId = String(payload.transactionId ?? payload.tran_id ?? "").trim();

  if (!orderId || !transactionId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Order ID and transaction ID are required");
  }

  await orderService.markSslPaymentSuccess(orderId, transactionId, payload);

  const redirectUrl = buildFrontendRedirectUrl("/payment/success", {
    orderId,
    transactionId,
  });

  res.redirect(redirectUrl);
});

const sslPaymentFail = catchAsync(async (req: Request, res: Response) => {
  const payload = getSslPayload(req);
  const orderId = String(payload.orderId ?? payload.value_a ?? "").trim();

  if (!orderId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Order ID is required");
  }

  await orderService.markSslPaymentFailed(orderId, payload);

  const redirectUrl = buildFrontendRedirectUrl("/payment/fail", {
    orderId,
    transactionId: String(payload.transactionId ?? payload.tran_id ?? "").trim() || undefined,
  });

  res.redirect(redirectUrl);
});

const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized access");
  }

  const result = await orderService.getMyOrders(req.user.id, req.query as Record<string, unknown>);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Orders retrieved successfully",
    meta: result.meta,
    data: result.data,
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

const getAdminStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await orderService.getAdminStats();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin order stats retrieved successfully",
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
  getAdminStats,
  updateOrderStatus,
};
