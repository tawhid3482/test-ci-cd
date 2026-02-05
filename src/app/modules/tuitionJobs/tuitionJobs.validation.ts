import { z } from "zod";

export const GenderEnum = z.enum(["Male", "Female", "Other"]);

export const createTuitionJobSchema = z.object({
  userId: z
    .string()
    .min(1, "User ID is required"),

  jobs_id: z
    .string()
    .min(1, "Job ID is required"),

  student_name: z
    .string()
    .min(2, "Student name must be at least 2 characters"),

  phone: z
    .string()
    .regex(/^(?:\+88)?01[3-9]\d{8}$/, "Invalid Bangladeshi phone number"),

  subject: z
    .array(z.string().min(1))
    .min(1, "At least one subject is required"),

  classes: z
    .array(z.string().min(1))
    .min(1, "At least one class is required"),

  medium: z
    .string()
    .min(1, "Medium is required"),

  days_per_week: z
    .string()
    .min(1, "Days per week is required"),

  district: z
    .string()
    .min(1, "District is required"),

  thana: z
    .string()
    .min(1, "Thana is required"),

  area: z
    .string()
    .min(1, "Area is required"),

  min_salary: z
    .string()
    .min(1, "Minimum salary is required"),

  max_salary: z
    .string()
    .min(1, "Maximum salary is required"),

  negotiable: z
    .boolean()
    .optional()
    .default(false),

  additional_requirements: z
    .string()
    .optional(),

  student_number: z
    .string()
    .min(1, "Student number is required"),

  student_gender: GenderEnum,

  tutor_gender: GenderEnum.optional(),

  status: z
    .string()
    .optional()
    .default("Active"),
});


export const updateTuitionJobSchema =
  createTuitionJobSchema.partial();
