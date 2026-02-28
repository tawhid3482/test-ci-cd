import { z } from "zod";

export const addToCartSchema = z
  .object({
    productId: z.string().min(1, "Product ID is required"),
    quantity: z
      .number({ message: "Quantity must be a number" })
      .int("Quantity must be an integer")
      .min(1, "Quantity must be at least 1"),
  })
  .strict();

export const updateCartQuantitySchema = z
  .object({
    quantity: z
      .number({ message: "Quantity must be a number" })
      .int("Quantity must be an integer")
      .min(1, "Quantity must be at least 1"),
  })
  .strict();
