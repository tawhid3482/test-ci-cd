import { TErrorSources } from "../types/error";

export const handleDuplicateError = (err: any) => {
  const keys = Object.keys(err.keyValue);
  const message = `${keys[0]} must be unique.`;

  return {
    statusCode: 400,
    message,
    errorSources: keys.map((key) => ({
      field: key,
      message: `${key} is already in use.`,
    })) as TErrorSources,
  };
};