import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { createProductSchema } from "./products.validation";
import { ProductController } from "./products.controller";


const router = Router();

router.post(
  "/create",
  validateRequest(createProductSchema),
  ProductController.createProduct,
);
router.get("/",  ProductController.getProduct);
router.get("/:productId",  ProductController.getSingleProduct);
router.patch("/update/:productId",  ProductController.getProduct);
router.delete("/delete/:productId",  ProductController.getProduct);

export const ProductRoute = router;
