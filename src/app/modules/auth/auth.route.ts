import { Router } from "express";
import { authController } from "./auth.controller";
import { authValidation } from "./auth.validation";
import { validateRequest } from "../../middlewares/validateRequest";
import { auth } from "../../middlewares/authMiddleware";
import { Role } from "@prisma/client";
import { authRateLimiter } from "../../middlewares/rateLimiter";

const router = Router();

router.post("/send-otp", authRateLimiter, authController.sendOtp);
router.post("/resend-otp", authRateLimiter, authController.resendOtp);
router.post("/verify-otp", authRateLimiter, authController.verifyOtp);

router.post(
  "/login",
  authRateLimiter,
  validateRequest(authValidation.authValidationSchema),
  authController.userLogin,
);

router.post("/refresh-token", authRateLimiter, authController.getNewAccessToken);

router.post("/logout", authController.logout);

router.post(
  "/change-password",
  auth(...Object.values(Role)),
  validateRequest(authValidation.changePasswordSchema),
  authController.changePassword,
);

router.post(
  "/forgot-password",
  authRateLimiter,
  validateRequest(authValidation.forgotPasswordSchema),
  authController.forgotPassword,
);

router.post(
  "/reset-password",
  authRateLimiter,
  validateRequest(authValidation.resetPasswordSchema),
  authController.resetPassword,
);

router.get("/session", authController.getSession);

export const AuthRoute = router;
