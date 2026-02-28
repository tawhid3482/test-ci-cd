import { Router } from "express";
import { Role } from "@prisma/client";
import { validateRequest } from "../../middlewares/validateRequest";
import { createProductSchema, updateProductSchema } from "./products.validation";
import { ProductController } from "./products.controller";
import { auth } from "../../middlewares/authMiddleware";

const router = Router();

router.post(
  "/create",
  // auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(createProductSchema),
  ProductController.createProduct,
);

router.get("/", ProductController.getProduct);

router.get("/category-products", ProductController.getCategoryProduct);
router.get("/:productId", ProductController.getSingleProduct);
router.get("/related-products/:categoryId", ProductController.getRelatedProduct);

router.patch(
  "/update/:productId",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updateProductSchema),
  ProductController.updateProduct,
);

router.delete(
  "/delete/:productId",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  ProductController.deleteProduct,
);

export const ProductRoute = router;
