import { Router } from "express";
import {
  authMiddleware,
  csrfMiddleware,
} from "../middlewares/auth.middleware.js";
import * as reviewControllers from "../controllers/review.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as reviewValidations from "../validations/review.validations.js";
const reviewRouter = Router();

reviewRouter.post(
  "/:productId",
  csrfMiddleware,
  authMiddleware,
  validate(reviewValidations.addReviewSchema),
  reviewControllers.addReview,
);

export default reviewRouter;
