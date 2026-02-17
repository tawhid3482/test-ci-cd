import { Router } from "express";
import { userController } from "./user.controller";
import { auth } from "../../middlewares/authMiddleware";

const router = Router();

router.post("/signup", userController.userSignUp);
router.get(
  "/allUsers",
  auth("ADMIN", "SUPER_ADMIN"),
  userController.getAllUsers,
);
router.get(
  "/me",
  auth("ADMIN", "SUPER_ADMIN", "USER", "MANAGER", ),
  userController.getMyProfile,
);


export const userRoute = router;
