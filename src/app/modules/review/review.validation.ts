import { z } from "zod";

const ratingSchema = z.coerce
  .number({ message: "Rating must be a number" })
  .int({ message: "Rating must be an integer" })
  .min(1, "Rating must be between 1 and 5")
  .max(5, "Rating must be between 1 and 5");

export const createReviewSchema = z
  .object({
    productId: z.string().min(1, "Product ID is required"),
    rating: ratingSchema.optional(),
    comment: z.string().trim().min(1, "Comment cannot be empty").optional(),
  })
  .refine((data) => data.rating !== undefined || data.comment, {
    message: "At least one of rating or comment is required",
  })
  .strict();

export const updateReviewSchema = z
  .object({
    rating: ratingSchema.optional(),
    comment: z.string().trim().min(1, "Comment cannot be empty").optional(),
  })
  .refine((data) => data.rating !== undefined || data.comment, {
    message: "At least one of rating or comment is required",
  })
  .strict();
