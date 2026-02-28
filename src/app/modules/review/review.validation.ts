import { z } from "zod";



export const createReviewSchema = z
  .object({
    productId: z.string().min(1, "Product ID is required"),
    rating: z.number({ message: "Rating must be a number" }).optional(),
    comment: z.string().trim().min(1, "Comment cannot be empty").optional(),
  })
  .refine((data) => data.rating || data.comment, {
    message: "At least one of rating or comment is required",
  })
  .strict();

export const updateReviewSchema = z
  .object({
    rating: z.number({ message: "Rating must be a number" }).optional(),
    comment: z.string().trim().min(1, "Comment cannot be empty").optional(),
  })
  .refine((data) => data.rating || data.comment, {
    message: "At least one of rating or comment is required",
  })
  .strict();

