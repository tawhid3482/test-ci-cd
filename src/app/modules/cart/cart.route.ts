import { Router } from "express";
import { auth } from "../../middlewares/authMiddleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { cartController } from "./cart.controller";
import { addToCartSchema, updateCartQuantitySchema } from "./cart.validation";

const router = Router();

router.post("/add", auth(), validateRequest(addToCartSchema), cartController.addToCart);
router.get("/me", auth(), cartController.getMyCart);
router.patch(
  "/update/:productId",
  auth(),
  validateRequest(updateCartQuantitySchema),
  cartController.updateCartQuantity,
);
router.delete("/remove/:productId", auth(), cartController.removeFromCart);

export const cartRoute = router;
