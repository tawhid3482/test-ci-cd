import { Router } from "express";
import { Role } from "@prisma/client";
import { validateRequest } from "../../middlewares/validateRequest";
import { createCategorySchema, updateCategorySchema } from "./categories.validation";
import { CategoryController } from "./categories.controller";
import { auth } from "../../middlewares/authMiddleware";

const router = Router();

router.post(
  "/create",
  // auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(createCategorySchema),
  CategoryController.createCategory,
);

router.get("/", CategoryController.getCategory);

router.patch(
  "/update/:categoryId",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updateCategorySchema),
  CategoryController.updateCategory,
);

router.delete(
  "/delete/:categoryId",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  CategoryController.deleteCategory,
);

export const categoryRoute = router;
