import { z } from "zod";

export const priorityStatusEnum = z.enum(["Urgent", "Normal"]);

export const createContactSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters long")
    .max(100, "Title cannot exceed 100 characters"),

  message: z
    .string()
    .min(10, "Message must be at least 10 characters long")
    .max(1000, "Message cannot exceed 1000 characters"),

  email: z
    .string()
    .email("Invalid email address"),

  priority: priorityStatusEnum.default("Normal"),
});
