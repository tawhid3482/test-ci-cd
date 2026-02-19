import z from "zod";

const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .max(72, { message: "Password is too long" });

const authValidationSchema = z
  .object({
    email: z.string().email(),
    password: passwordSchema,
  })
  .strict();

const forgotPasswordSchema = z
  .object({
    email: z.string().email(),
  })
  .strict();

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    newPassword: passwordSchema,
  })
  .strict();

const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1),
    newPassword: passwordSchema,
  })
  .strict();

export const authValidation = {
  authValidationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
