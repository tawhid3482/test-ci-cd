// src/modules/notification/notification.validation.ts
import { z } from "zod";

export const saveTokenSchema = z.object({
  body: z.object({
    token: z.string().min(10),
    platform: z.enum(["web", "android", "ios"]).optional(),
  }),
});
