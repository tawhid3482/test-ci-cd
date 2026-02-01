import { Router } from "express";
import { webSettingController } from "./webSetting.controller";

const router = Router();

router.post(
  "/create-web-setting",
  //   validateRequest(webSettingValidation.webSettingValidationSchema),
  webSettingController.createWebSetting,
);
router.get("/", webSettingController.getWebSetting);

export const webSettingRoute = router;
