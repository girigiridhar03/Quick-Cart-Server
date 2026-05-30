import { Router } from "express";
import {
  authMiddleware,
  csrfMiddleware,
  roleCheckMiddleware,
} from "../middlewares/auth.middleware.js";
import * as categoryControllers from "../controllers/category.controller.js";
import * as categoryValidations from "../validations/category.validations.js";
import { validate } from "../middlewares/validate.middleware.js";

const categoryRouter = Router();

categoryRouter.post(
  "/",
  csrfMiddleware,
  authMiddleware,
  roleCheckMiddleware("ADMIN"),
  validate(categoryValidations.createCategorySchema),
  categoryControllers.createCategory,
);

categoryRouter.post(
  "/subcategory",
  csrfMiddleware,
  authMiddleware,
  roleCheckMiddleware("ADMIN"),
  validate(categoryValidations.createSubCategorySchema),
  categoryControllers.createSubCategory,
);

categoryRouter.get("/", categoryControllers.getAllCategories);

// Dynamic Routes
categoryRouter.delete(
  "/:id",
  csrfMiddleware,
  authMiddleware,
  roleCheckMiddleware("ADMIN"),
  categoryControllers.deleteCategory,
);
categoryRouter.patch(
  "/:id",
  csrfMiddleware,
  authMiddleware,
  roleCheckMiddleware("ADMIN"),
  validate(categoryValidations.updateCategorySchema),
  categoryControllers.updateCategory,
);

categoryRouter.get("/subcategory/:id", categoryControllers.getAllSubCategories);
categoryRouter.delete(
  "/subcategory/:id",
  csrfMiddleware,
  authMiddleware,
  roleCheckMiddleware("ADMIN"),
  categoryControllers.deleteSubCategory,
);
categoryRouter.patch(
  "/subcategory/:id",
  csrfMiddleware,
  authMiddleware,
  roleCheckMiddleware("ADMIN"),
  validate(categoryValidations.updateSubCategorySchema),
  categoryControllers.updateSubCategory,
);

export default categoryRouter;
