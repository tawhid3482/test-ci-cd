import dotenv from "dotenv";

dotenv.config();

interface EnvVars {
  PORT: string;
  NODE_ENV: string;
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_EXPIRES_IN: string;
  BCRYPT_SALT_ROUND: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRED: string;
  EMAIL: string;
  APP_PASS: string;


}

const loadEnvVariables = (): EnvVars => {
  const requiredVars = [
    "PORT",
    "NODE_ENV",
    "DATABASE_URL",
    "JWT_ACCESS_SECRET",
    "JWT_EXPIRES_IN",
    "BCRYPT_SALT_ROUND",
    "JWT_REFRESH_SECRET",
    "JWT_REFRESH_EXPIRED",
    "EMAIL",
    "APP_PASS",
    
  ];
  requiredVars.forEach((key) => {
    if (!process.env[key]) {
      {
        throw new Error(`Environment variable ${key}is not set`);
      }
    }
  });
  return {
    PORT: process.env.PORT as string,
    NODE_ENV: process.env.NODE_ENV as string,
    DATABASE_URL: process.env.DATABASE_URL as string,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN as string,
    BCRYPT_SALT_ROUND: process.env.BCRYPT_SALT_ROUND as string,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
    JWT_REFRESH_EXPIRED: process.env.JWT_REFRESH_EXPIRED as string,
    EMAIL: process.env.EMAIL as string,
    APP_PASS: process.env.APP_PASS as string,
    
  };
};

export const envVars = loadEnvVariables();
