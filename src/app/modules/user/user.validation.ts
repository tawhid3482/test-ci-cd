import { z } from "zod";

const userSignUpSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email(),
    phone: z.string().min(6).max(20),
    password: z.string().min(6).max(72),
    gender: z.enum(["Male", "Female", "Other"]).optional(),
    avatar: z.string().url().optional(),
    acceptTerms: z.boolean().optional(),
  })
  .strict();

export const userValidation = {
  userSignUpSchema,
};
