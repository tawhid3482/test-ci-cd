import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { createCategorySchema } from "./categories.validation";
import { CategoryController } from "./categories.controller";


const router = Router();

router.post(
  "/create",
  validateRequest(createCategorySchema),
  CategoryController.createCategory,
);
router.get("/",  CategoryController.getCategory);
router.patch("/update/:categoryId",  CategoryController.getCategory);
router.delete("/delete/:categoryId",  CategoryController.getCategory);

export const categoryRoute = router;
