import { Router } from "express";
import {
  authMiddleware,
  csrfMiddleware,
} from "../middlewares/auth.middleware.js";
import * as cartController from "../controllers/cart.controller.js";

const cartRouter = Router();

cartRouter.get("/", authMiddleware, cartController.getAllCarts);

cartRouter.delete(
  "/",
  csrfMiddleware,
  authMiddleware,
  cartController.clearCart,
);

cartRouter.post(
  "/:productId",
  csrfMiddleware,
  authMiddleware,
  cartController.addToCart,
);

cartRouter.delete(
  "/:id",
  csrfMiddleware,
  authMiddleware,
  cartController.deleteCartItem,
);

export default cartRouter;
