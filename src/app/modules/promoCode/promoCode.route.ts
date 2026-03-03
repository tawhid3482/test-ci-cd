import { Router } from "express";
import { Role } from "@prisma/client";
import { auth } from "../../middlewares/authMiddleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { promoCodeController } from "./promoCode.controller";
import {
  applyPromoCodeSchema,
  createPromoCodeSchema,
  updatePromoCodeSchema,
} from "./promoCode.validation";

const router = Router();

router.post(
  "/apply",
  auth(),
  validateRequest(applyPromoCodeSchema),
  promoCodeController.applyPromoCode,
);

router.post(
  "/create",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(createPromoCodeSchema),
  promoCodeController.createPromoCode,
);

router.get("/", auth(Role.ADMIN, Role.SUPER_ADMIN), promoCodeController.getPromoCodes);

router.patch(
  "/update/:promoCodeId",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updatePromoCodeSchema),
  promoCodeController.updatePromoCode,
);

router.delete(
  "/delete/:promoCodeId",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  promoCodeController.deletePromoCode,
);

export const promoCodeRoute = router;
