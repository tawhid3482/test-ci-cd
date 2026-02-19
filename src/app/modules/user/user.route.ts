import { Router } from "express";
import { Role } from "@prisma/client";
import { userController } from "./user.controller";
import { auth } from "../../middlewares/authMiddleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { userValidation } from "./user.validation";

const router = Router();

router.post("/signup", validateRequest(userValidation.userSignUpSchema), userController.userSignUp);

router.get(
  "/allUsers",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  userController.getAllUsers,
);

router.get(
  "/me",
  auth(Role.ADMIN, Role.SUPER_ADMIN, Role.USER, Role.MANAGER),
  userController.getMyProfile,
);

export const userRoute = router;
