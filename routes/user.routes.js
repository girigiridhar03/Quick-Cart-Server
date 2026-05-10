import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import * as schemas from "../validations/user.validations.js";
import * as userControllers from "../controllers/user.controller.js";
import {
  authMiddleware,
  csrfMiddleware,
  tokenVersionMiddleware,
} from "../middlewares/auth.middleware.js";

const userRouter = Router();

// Auth Routes
userRouter.post(
  "/register",
  validate(schemas.registerSchema),
  userControllers.register,
);
userRouter.post("/login", validate(schemas.loginSchema), userControllers.login);
userRouter.post(
  "/logout",
  csrfMiddleware,
  authMiddleware,
  userControllers.logout,
);

// User Routes
userRouter.get(
  "/me",
  authMiddleware,
  tokenVersionMiddleware,
  userControllers.userDetails,
);

export default userRouter;
