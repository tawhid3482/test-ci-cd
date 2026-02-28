import { Router } from "express";
import { auth } from "../../middlewares/authMiddleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { reviewController } from "./review.controller";
import { createReviewSchema, updateReviewSchema } from "./review.validation";

const router = Router();

router.post("/create", auth(), validateRequest(createReviewSchema), reviewController.createReview);
router.get("/product/:productId", reviewController.getProductReviews);
router.get("/me", auth(), reviewController.getMyReviews);
router.patch("/update/:reviewId", auth(), validateRequest(updateReviewSchema), reviewController.updateReview);
router.delete("/delete/:reviewId", auth(), reviewController.deleteReview);

export const reviewRoute = router;
