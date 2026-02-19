import { z } from "zod";

const productBaseSchema = {
  name: z
    .string()
    .min(3, { message: "Product name must be at least 3 characters long" })
    .max(100, { message: "Product name cannot exceed 100 characters" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters long" }),
  price: z
    .number({
      message: "Price must be a number",
    })
    .positive({ message: "Price must be greater than 0" }),
  stock: z
    .number({
      message: "Stock must be a number",
    })
    .int({ message: "Stock must be an integer" })
    .min(0, { message: "Stock cannot be negative" }),
  images: z
    .array(z.string().url({ message: "Each image must be a valid URL" }))
    .min(1, { message: "At least one image is required" }),
  categoryId: z.string().min(1, { message: "Category ID is required" }),
};

export const createProductSchema = z.object(productBaseSchema).strict();

export const updateProductSchema = z
  .object({
    name: productBaseSchema.name.optional(),
    description: productBaseSchema.description.optional(),
    price: productBaseSchema.price.optional(),
    stock: productBaseSchema.stock.optional(),
    images: productBaseSchema.images.optional(),
    categoryId: productBaseSchema.categoryId.optional(),
  })
  .strict();
