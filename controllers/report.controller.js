import mongoose from "mongoose";
import { asyncHandler } from "../utils/handler.js";
import AppError from "../utils/AppError.js";
import Review from "../models/review.model.js";
import Product from "../models/product.model.js";
import Report from "../models/report.model.js";
import response from "../utils/response.js";

export const createReport = asyncHandler(async (req, res) => {
  const userId = req?.user?.id;
  const { targetType, targetedId, reason, description } = req.body;
  const Modal = { Review, Product };
  const data = await Modal[targetType].findById(targetedId);
  if (!data) {
    throw new AppError(`${targetType} not found`, 404);
  }

  const report = await Report.findOne({
    reportedBy: userId,
    targetedId: data._id,
    targetType,
  });

  if (report) {
    return response(res, 200, "Report already exist", report);
  }

  const createReport = await Report.create({
    reportedBy: userId,
    targetType,
    targetedId,
    reason,
    description,
  });

  return response(res, 201, "Successfully repored", createReport);
});
