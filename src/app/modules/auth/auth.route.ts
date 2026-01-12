import { Router } from "express";
// import { authController } from "./auth.controller";
// import { checkAuth } from "../../middlewares/checkAuth";
// import { Role } from "../user/user.interface";

const router = Router();

// router.post("/login", authController.userLogin);
// router.post("/refresh-token", authController.getNewAccessToken);

// router.post("/logout", authController.logout);


// router.post("/change-password", checkAuth(...Object.values(Role)), authController.changePassword)


// // router.post("/forgot-password", authController.forgotPassword)

// router.post("/reset-password",authController.resetPassword)
export const AuthRoute = router;