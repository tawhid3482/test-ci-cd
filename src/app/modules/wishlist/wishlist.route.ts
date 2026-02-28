import { Router } from "express";
import { auth } from "../../middlewares/authMiddleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { wishlistController } from "./wishlist.controller";
import { addToWishlistSchema } from "./wishlist.validation";

const router = Router();

router.post("/add", auth(), validateRequest(addToWishlistSchema), wishlistController.addToWishlist);
router.get("/me", auth(), wishlistController.getMyWishlist);
router.delete("/remove/:productId", auth(), wishlistController.removeFromWishlist);

export const wishlistRoute = router;
