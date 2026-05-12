import { Router } from "express";
import {
  authMiddleware,
  csrfMiddleware,
} from "../middlewares/auth.middleware.js";
import * as addressControllers from "../controllers/address.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as addressValidations from "../validations/address.validations.js";
const addressRouter = Router();

addressRouter.post(
  "/",
  csrfMiddleware,
  authMiddleware,
  validate(addressValidations.addAddressSchema),
  addressControllers.addAddress,
);
addressRouter.get("/", authMiddleware, addressControllers.getAllAddress);

// Dynamic Routes
addressRouter.patch(
  "/:id",
  csrfMiddleware,
  authMiddleware,
  validate(addressValidations.updateAddressSchema),
  addressControllers.updateAddress,
);
addressRouter.delete(
  "/:id",
  csrfMiddleware,
  authMiddleware,
  addressControllers.deleteAddress,
);

export default addressRouter;
