import { Router } from "express";
import * as reportControllers from "../controllers/report.controller.js";
import * as authMiddlewares from "../middlewares/auth.middleware.js";
import * as schemaValidations from "../validations/report.validations.js";
import { validate } from "../middlewares/validate.middleware.js";
const reportRouter = Router();

reportRouter.post(
  "/",
  authMiddlewares.csrfMiddleware,
  authMiddlewares.authMiddleware,
  validate(schemaValidations.createReportSchema),
  reportControllers.createReport,
);
export default reportRouter;
