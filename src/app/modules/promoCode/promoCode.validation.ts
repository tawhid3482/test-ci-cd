import { z } from "zod";

const dateStringSchema = z.string().datetime({ message: "Invalid datetime format" });

export const createPromoCodeSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, "Code must be at least 2 characters")
      .max(50, "Code cannot exceed 50 characters")
      .regex(/^[A-Za-z0-9_-]+$/, "Code can only contain letters, numbers, _ and -"),
    discountPercentage: z
      .number({ message: "Discount percentage must be a number" })
      .gt(0, "Discount percentage must be greater than 0")
      .lte(100, "Discount percentage cannot exceed 100"),
    minOrderAmount: z.number({ message: "Minimum order amount must be a number" }).min(0).optional(),
    usageLimit: z.number({ message: "Usage limit must be a number" }).int().positive().optional(),
    startsAt: dateStringSchema.optional(),
    expiresAt: dateStringSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.startsAt && value.expiresAt) {
      const startsAt = new Date(value.startsAt);
      const expiresAt = new Date(value.expiresAt);

      if (expiresAt <= startsAt) {
        ctx.addIssue({
          code: "custom",
          message: "expiresAt must be later than startsAt",
          path: ["expiresAt"],
        });
      }
    }
  });

export const updatePromoCodeSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, "Code must be at least 2 characters")
      .max(50, "Code cannot exceed 50 characters")
      .regex(/^[A-Za-z0-9_-]+$/, "Code can only contain letters, numbers, _ and -")
      .optional(),
    discountPercentage: z
      .number({ message: "Discount percentage must be a number" })
      .gt(0, "Discount percentage must be greater than 0")
      .lte(100, "Discount percentage cannot exceed 100")
      .optional(),
    minOrderAmount: z.number({ message: "Minimum order amount must be a number" }).min(0).optional(),
    usageLimit: z.number({ message: "Usage limit must be a number" }).int().positive().nullable().optional(),
    startsAt: dateStringSchema.nullable().optional(),
    expiresAt: dateStringSchema.nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.startsAt && value.expiresAt) {
      const startsAt = new Date(value.startsAt);
      const expiresAt = new Date(value.expiresAt);

      if (expiresAt <= startsAt) {
        ctx.addIssue({
          code: "custom",
          message: "expiresAt must be later than startsAt",
          path: ["expiresAt"],
        });
      }
    }
  });

export const applyPromoCodeSchema = z
  .object({
    promoCode: z.string().trim().min(2, "Promo code is too short").max(50),
    deliveryFee: z.number({ message: "Delivery fee must be a number" }).min(0).optional(),
  })
  .strict();
