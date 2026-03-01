import { z } from "zod";

export const createOrderSchema = z
  .object({
    shippingAddress: z.string().trim().min(5, "Shipping address is too short").optional(),
    phone: z.string().trim().min(6, "Phone is too short").optional(),
    note: z.string().trim().max(500, "Note is too long").optional(),
    deliveryFee: z.number({ message: "Delivery fee must be a number" }).min(0).optional(),
    paymentMethod: z.enum(["COD", "SSLCOMMERZ"]).optional(),
  })
  .strict();

export const updateOrderStatusSchema = z
  .object({
    status: z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]),
  })
  .strict();

export const sslPaymentSuccessSchema = z
  .object({
    orderId: z.string().min(1, "Order ID is required"),
    transactionId: z.string().min(1, "Transaction ID is required"),
  })
  .strict();

export const sslPaymentFailSchema = z
  .object({
    orderId: z.string().min(1, "Order ID is required"),
  })
  .strict();
