import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import * as schemas from "../validations/user.validations.js";
import * as userControllers from "../controllers/user.controller.js";
import {
  authMiddleware,
  csrfMiddleware,
  tokenVersionMiddleware,
} from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

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
userRouter.post(
  "/refreshToken",
  csrfMiddleware,
  authMiddleware,
  userControllers.refreshToken,
);

// User Routes
userRouter.get("/me", authMiddleware, userControllers.userDetails);
userRouter.patch(
  "/",
  csrfMiddleware,
  authMiddleware,
  upload.single("profile"),
  userControllers.updateUserDetails,
);

export default userRouter;
