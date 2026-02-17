import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(3, "Title must be at least 3 characters long")
    .max(100, "Title cannot exceed 100 characters"),

  image: z.string().optional(),
});
