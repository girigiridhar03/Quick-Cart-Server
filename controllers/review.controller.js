import mongoose from "mongoose";
import { asyncHandler } from "../utils/handler.js";
import AppError from "../utils/AppError.js";
import {
  deleteFileFromCloudinary,
  uploadToCloudinary,
} from "../config/cloudinary.config.js";
import Review from "../models/review.model.js";
import response from "../utils/response.js";
import Product from "../models/product.model.js";

export const addReview = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  const { rating, title, body } = req.body;

  if (!mongoose.isValidObjectId(productId)) {
    throw new AppError(`Invalid Id: ${productId}`, 400);
  }

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  });
  console.log(product, productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  let uploadedImages = [];
  if (req?.files?.length > 0) {
    try {
      uploadedImages = await Promise.all(
        req.files.map(async (img) => {
          const result = await uploadToCloudinary(img.buffer);
          return {
            url: result?.secure_url,
            publicId: result?.public_id,
          };
        }),
      );
    } catch (error) {
      if (uploadedImages.length > 0) {
        await Promise.all(
          uploadedImages.map(
            async (img) => await deleteFileFromCloudinary(img.publicId),
          ),
        );
      }
      throw error;
    }
  }

  try {
    const newReview = await Review.create({
      user: userId,
      product: productId,
      rating,
      title,
      body,
      ...(uploadedImages.length > 0 ? { images: uploadedImages } : {}),
    });

    const reviewAggregations = await Review.aggregate([
      {
        $match: {
          product: product._id,
        },
      },
      {
        $group: {
          _id: null,
          avgRating: {
            $avg: "$rating",
          },
          totalReviewers: {
            $sum: 1,
          },
        },
      },
    ]);

    product.avgRating = reviewAggregations[0]?.avgRating ?? 0;
    product.reviewersCount = reviewAggregations[0]?.totalReviewers ?? 0;
    await product.save();

    return response(res, 201, "Review posted successfully", newReview);
  } catch (error) {
    if (uploadedImages.length > 0) {
      await Promise.all(
        uploadedImages.map(
          async (img) => await deleteFileFromCloudinary(img.publicId),
        ),
      );
    }
    throw error;
  }
});
