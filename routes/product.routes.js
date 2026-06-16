import { Router } from "express";
import {
  authMiddleware,
  csrfMiddleware,
  roleCheckMiddleware,
  userExist,
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

productRouter.get("/", userExist, productControllers.getAllProducts);
productRouter.get("/brands", productControllers.getAllBrands);

productRouter.get("/:slug",userExist, productControllers.getSingleProduct);
productRouter.patch(
  "/:id",
  csrfMiddleware,
  authMiddleware,
  roleCheckMiddleware("ADMIN"),
  upload.array("images", 5),
  validate(productValidations.updateProductSchema),
  productControllers.updateProduct,
);
productRouter.get(
  "/:slugId/related",
  userExist,
  productControllers.getRelatedProducts,
);
productRouter.delete(
  "/:productId/image/:imageId",
  csrfMiddleware,
  authMiddleware,
  roleCheckMiddleware("ADMIN"),
  productControllers.deleteImages,
);

export default productRouter;
