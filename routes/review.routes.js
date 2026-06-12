import { Router } from "express";
import {
  authMiddleware,
  csrfMiddleware,
} from "../middlewares/auth.middleware.js";
import * as reviewControllers from "../controllers/review.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as reviewValidations from "../validations/review.validations.js";
import upload from "../middlewares/multer.middleware.js";
const reviewRouter = Router();

reviewRouter.delete(
  "/:reviewId",
  csrfMiddleware,
  authMiddleware,
  reviewControllers.deleteReview,
);

reviewRouter.patch(
  "/:reviewId",
  csrfMiddleware,
  authMiddleware,
  upload.array("images", 5),
  validate(reviewValidations.editReviewSchema),
  reviewControllers.editReview,
);

reviewRouter.post(
  "/product/:productId",
  csrfMiddleware,
  authMiddleware,
  upload.array("images", 5),
  validate(reviewValidations.addReviewSchema),
  reviewControllers.addReview,
);

reviewRouter.get("/product/:productId", reviewControllers.getAllReviews);
reviewRouter.get(
  "/product/:productId/reviewsummary",
  reviewControllers.reviewSummary,
);

export default reviewRouter;
