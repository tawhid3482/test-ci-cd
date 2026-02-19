import { z } from "zod";

export const webSettingSchema = z
  .object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    accentColor: z.string().optional(),
    textColor: z.string().optional(),
    textSecondary: z.string().optional(),
    background: z.string().optional(),
    cardBg: z.string().optional(),
    borderColor: z.string().optional(),
    hoverPrimary: z.string().optional(),
    hoverSecondary: z.string().optional(),
    hoverAccent: z.string().optional(),
    btnBg: z.string().optional(),
    btnHover: z.string().optional(),
    btnActive: z.string().optional(),
    btnText: z.string().optional(),
    fb_pixel: z.string().optional(),
    google_tag_manager: z.string().optional(),
  })
  .strict();

export const webSettingValidation = {
  webSettingSchema,
};
