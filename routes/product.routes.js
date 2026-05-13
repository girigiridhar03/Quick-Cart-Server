import { Router } from "express";
import {
  authMiddleware,
  csrfMiddleware,
  roleCheckMiddleware,
} from "../middlewares/auth.middleware.js";
import * as productControllers from "../controllers/product.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as productValidations from "../validations/product.validations.js";
import upload from "../middlewares/multer.middleware.js";

const productRouter = Router();

productRouter.post(
  "/",
  csrfMiddleware,
  authMiddleware,
  roleCheckMiddleware("ADMIN"),
  upload.array("images", 5),
  validate(productValidations.createProductSchema),
  productControllers.createProduct,
);

productRouter.patch(
  "/:id",
  csrfMiddleware,
  authMiddleware,
  roleCheckMiddleware("ADMIN"),
  upload.array("images", 5),
  validate(productValidations.updateProductSchema),
  productControllers.updateProduct,
);

export default productRouter;
