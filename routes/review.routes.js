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

reviewRouter.post(
  "/product/:productId",
  csrfMiddleware,
  authMiddleware,
  upload.array("images", 5),
  validate(reviewValidations.addReviewSchema),
  reviewControllers.addReview,
);

reviewRouter.get(
  "/product/:productId",
  authMiddleware,
  reviewControllers.getAllReviews,
);

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

export default reviewRouter;
