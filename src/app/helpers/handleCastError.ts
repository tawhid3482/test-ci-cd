import { TErrorSources } from "../types/error";

export const handleCastError = (err: any) => {
  return {
    statusCode: 400,
    message: "Invalid ID format",
    errorSources: [
      {
        field: err.path,
        message: `Invalid value for ${err.path}`,
      },
    ] as TErrorSources,
  };
};