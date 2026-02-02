import httpStatus from "http-status";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const createWebSetting = async (payload: any) => {
  const existing = await prisma.webSetting.findFirst();

  if (existing) {
    return await prisma.webSetting.update({
      where: { id: existing.id },
      data: payload,
    });
  } else {
    return await prisma.webSetting.create({
      data: payload,
    });
  }
};


const getWebSetting = async () => {
  const webSetting = await prisma.webSetting.findFirst({});
  return webSetting;
};

export const webSettingService = {
  createWebSetting,
  getWebSetting,
};
