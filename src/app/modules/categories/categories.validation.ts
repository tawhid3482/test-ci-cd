import { z } from "zod";

const categoryBaseSchema = {
  name: z
    .string()
    .min(3, "Title must be at least 3 characters long")
    .max(100, "Title cannot exceed 100 characters"),
  image: z.string().url().optional(),
};

export const createCategorySchema = z.object(categoryBaseSchema).strict();

export const updateCategorySchema = z
  .object({
    name: categoryBaseSchema.name.optional(),
    image: categoryBaseSchema.image,
  })
  .strict();
