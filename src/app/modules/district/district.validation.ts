import { z } from "zod";

export const createDistrictSchema = z.object({
  name: z
    .string()
    .min(2, "District name must be at least 2 characters")
    .trim(),

  thanas: z
    .array(
      z.string().min(1, "Thana name cannot be empty").trim()
    )
    .min(1, "At least one thana is required"),

  areas: z
    .array(
      z.string().min(1, "Area name cannot be empty").trim()
    )
    .min(1, "At least one area is required"),
});

export const updateDistrictSchema = createDistrictSchema.partial();
