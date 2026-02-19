import { Router } from "express";
import { Role } from "@prisma/client";
import { webSettingController } from "./webSetting.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { webSettingValidation } from "./webSetting.validation";
import { auth } from "../../middlewares/authMiddleware";

const router = Router();

router.post(
  "/create-web-setting",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(webSettingValidation.webSettingSchema),
  webSettingController.createWebSetting,
);

router.get("/", webSettingController.getWebSetting);

export const webSettingRoute = router;
