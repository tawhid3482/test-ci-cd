import { ZodError } from "zod";
import { TErrorSources } from "../types/error";

export const handleZodError = (err: ZodError) => {
  const errorSources: TErrorSources = err.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

  return {
    statusCode: 400,
    message: "Zod Validation Error",
    errorSources,
  };
};