import { z } from "zod";

export const createOrderSchema = z
  .object({
    shippingAddress: z.string().trim().min(5, "Shipping address is too short").optional(),
    phone: z.string().trim().min(6, "Phone is too short").optional(),
    note: z.string().trim().max(500, "Note is too long").optional(),
    promoCode: z.string().trim().min(2, "Promo code is too short").max(50).optional(),
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
    orderId: z.string().min(1, "Order ID is required").optional(),
    transactionId: z.string().min(1, "Transaction ID is required").optional(),
    value_a: z.string().min(1).optional(),
    tran_id: z.string().min(1).optional(),
  })
  .passthrough()
  .refine((value) => Boolean(value.orderId || value.value_a), {
    message: "Order ID is required",
    path: ["orderId"],
  })
  .refine((value) => Boolean(value.transactionId || value.tran_id), {
    message: "Transaction ID is required",
    path: ["transactionId"],
  });

export const sslPaymentFailSchema = z
  .object({
    orderId: z.string().min(1, "Order ID is required").optional(),
    value_a: z.string().min(1).optional(),
  })
  .passthrough()
  .refine((value) => Boolean(value.orderId || value.value_a), {
    message: "Order ID is required",
    path: ["orderId"],
  });
