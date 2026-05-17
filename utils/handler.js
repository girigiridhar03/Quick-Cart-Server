import { MulterError } from "multer";
import AppError from "./AppError.js";
import logger from "./logger.js";
import response from "./response.js";

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const errorHandler = (err, req, res, next) => {
  logger.error(err, {
    route: req.originalUrl,
    ip: req.ip,
    method: req.method,
  });

  if (err.message === "Origin not allowed by CORS") {
    return response(res, 403, err.message);
  }
  if (err instanceof AppError) {
    return response(res, 400, err.message);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];

    return response(res, 409, `${field} already exists`);
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return response(res, 400, messages.join(", "));
  }

  if (err instanceof MulterError) {
    return response(res, 400, err.message);
  }

  return response(res, 500, "Internal server error");
};
