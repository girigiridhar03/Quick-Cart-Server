import { Router } from "express";
import {
  authMiddleware,
  csrfMiddleware,
  userExist,
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
reviewRouter.patch(
  "/:reviewId/helpful",
  csrfMiddleware,
  authMiddleware,
  reviewControllers.helpfulReview,
);
reviewRouter.delete(
  "/:reviewId/image/:imageId",
  csrfMiddleware,
  authMiddleware,
  reviewControllers.deleteReviewImage,
);
reviewRouter.post(
  "/product/:slugId",
  csrfMiddleware,
  authMiddleware,
  upload.array("images", 5),
  validate(reviewValidations.addReviewSchema),
  reviewControllers.addReview,
);

reviewRouter.get(
  "/product/:slugId",
  userExist,
  reviewControllers.getAllReviews,
);
reviewRouter.get(
  "/product/:slugId/reviewsummary",
  userExist,
  reviewControllers.reviewSummary,
);

export default reviewRouter;
