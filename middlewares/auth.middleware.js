import { ACCESS_TOKEN, CSRF_TOKEN } from "../utils/constant.js";
import response from "../utils/response.js";
import logger from "../utils/logger.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const csrfMiddleware = (req, res, next) => {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) return next();
  const csrfCookie = req.cookies?.[CSRF_TOKEN];
  const csrfHeader = req.headers["x-csrf-token"];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return response(res, 400, "Invalid CSRF Token");
  }

  return next();
};

export const authMiddleware = (req, res, next) => {
  try {
    const accessCookie = req.cookies?.[ACCESS_TOKEN];
    if (!accessCookie) {
      return response(res, 400, "Access Token is required");
    }
    const decodedToken = jwt.verify(accessCookie, process.env.ACCESS_SECRET);
    req.user = decodedToken;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return response(res, 401, "Token expired");
    }
    logger.warn("Access token validation failed", {
      method: req.method,
      path: req.originalUrl,
    });
    return response(res, 401, "Unauthorized");
  }
};
export const tokenVersionMiddleware = async (req, res, next) => {
  try {
    const loginUser = req.user;
    const user = await User.findById(loginUser.id);
    if (!user || user.tokenVersion !== loginUser.tokenVersion) {
      return response(res, 401, "Unauthorized");
    }

    return next();
  } catch (error) {
    logger.error("Token version validation failed", {
      method: req.method,
      path: req.originalUrl,
    });
    return response(res, 401, "Unauthorized");
  }
};

export const roleCheckMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return response(res, 403, "Access denied: You are not authorized");
    }
    return next();
  };
};
