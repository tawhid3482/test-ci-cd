import httpStatus from "http-status";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const createWebSetting = async (payload: any) => {
  const webSetting = await prisma.webSetting.create({
    data: payload,
  });
  return webSetting;
};
const getWebSetting = async () => {
  const webSetting = await prisma.webSetting.findFirst({});
  return webSetting;
};

export const webSettingService = {
  createWebSetting,
  getWebSetting,
};
