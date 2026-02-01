import z from "zod";

const authValidationSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(4),
  })
  .strict();

export const authValidation = {
  authValidationSchema,
};
