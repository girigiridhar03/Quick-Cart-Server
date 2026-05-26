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

cartRouter.patch(
  "/product/:id/descrease",
  csrfMiddleware,
  authMiddleware,
  cartController.descreaseItemQuantity,
);

cartRouter.post(
  "/product/:productId/add",
  csrfMiddleware,
  authMiddleware,
  cartController.addToCart,
);

cartRouter.delete(
  "/product/:id",
  csrfMiddleware,
  authMiddleware,
  cartController.deleteCartItem,
);

export default cartRouter;
