import { Router } from "express";
import { authController } from "./auth.controller";
import { auth } from "../../middlewares/authMiddleware";
import { Role } from "@prisma/client";

const router = Router();

router.post("/send-otp", authController.sendOtp);
router.post("/resend-otp", authController.resendOtp);
router.post("/verify-otp", authController.verifyOtp);


router.post("/login", authController.userLogin);

router.post("/refresh-token", authController.getNewAccessToken);

router.post("/logout", authController.logout);


router.post("/change-password", auth(...Object.values(Role)), authController.changePassword)


router.post("/forgot-password", authController.forgotPassword)

router.post("/reset-password",authController.resetPassword)
export const AuthRoute = router;