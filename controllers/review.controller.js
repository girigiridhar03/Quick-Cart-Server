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
  const { slugId } = req.params;
  const { rating, title, body } = req.body;
  const reviewExist = await Review.findOne({ user: userId });
  if (reviewExist) {
    throw new AppError(
      `You have already reviewed this product. Please edit your existing review if you'd like to make changes.`,
      409,
    );
  }
  const product = await Product.findOne({
    slug: slugId,
    isActive: true,
  });
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  let uploadedImages = [];
  if (req?.files?.length > 0) {
    try {
      uploadedImages = await Promise.all(
        req.files.map(async (img) => {
          const result = await uploadToCloudinary(img.buffer, "review");
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
      product: product._id,
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

export const getAllReviews = asyncHandler(async (req, res) => {
  const { slugId } = req.params;
  const { role } = req?.user ?? {};
  const { search, sort, isHidden } = req.query;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const skip = (page - 1) * limit;

  const product = await Product.findOne({ slug: slugId }).select("_id");

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  let matchStage = {
    product: product._id,
  };

  if (role !== "ADMIN") {
    matchStage.isHidden = false;
  }

  if (search && search.trim()) {
    matchStage.$or = [
      { title: { $regex: search, $options: "i" } },
      { body: { $regex: search, $options: "i" } },
    ];
  }

  if (
    isHidden !== undefined &&
    ["true", "false"].includes(isHidden) &&
    role === "ADMIN"
  ) {
    matchStage.isHidden = isHidden === "true";
  }

  const userMatchStage = search
    ? {
        $and: [
          { $eq: ["$_id", "$$userId"] },
          {
            $or: [
              {
                $regexMatch: { input: "$email", regex: search, options: "i" },
              },
              {
                $regexMatch: {
                  input: "$username",
                  regex: search,
                  options: "i",
                },
              },
              {
                $regexMatch: {
                  input: "$phoneNumber",
                  regex: search,
                  options: "i",
                },
              },
            ],
          },
        ],
      }
    : { $eq: ["$_id", "$$userId"] };

  const userProject =
    role === "ADMIN"
      ? { username: 1, email: 1, phoneNumber: 1, profile: 1 }
      : { username: 1, profile: 1 };

  const helpfulLookUpStages = [
    {
      $lookup: {
        from: "users",
        localField: "helpfulYes",
        foreignField: "_id",
        pipeline: [
          {
            $project:
              role === "ADMIN"
                ? { username: 1, email: 1, phoneNumber: 1, profile: 1 }
                : { _id: 1 },
          },
        ],
        as: "helpfulYesUsers",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "helpfulNo",
        foreignField: "_id",
        pipeline: [
          {
            $project:
              role === "ADMIN"
                ? { username: 1, email: 1, phoneNumber: 1, profile: 1 }
                : { _id: 1 },
          },
        ],
        as: "helpfulNoUsers",
      },
    },
  ];

  const adminProject = {
    userDetails: 1,
    title: 1,
    body: 1,
    rating: 1,
    images: 1,
    adminReply: 1,
    isHidden: 1,
    flagCount: 1,
    isFlagged: 1,
    productDetails: 1,
    helpfulYesCount: 1,
    helpfulNoCount: 1,
    helpfulYesUsers: 1,
    helpfulNoUsers: 1,
    createdAt: 1,
  };

  const clientProject = {
    userDetails: 1,
    title: 1,
    body: 1,
    rating: 1,
    images: 1,
    adminReply: 1,
    productDetails: 1,
    helpfulYesCount: 1,
    helpfulNoCount: 1,
    createdAt: 1,
  };

  const sortObj = {
    latest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    highestRated: { rating: -1 },
    lowestRated: { rating: 1 },
    mostFlagged: { flagCount: -1 },
  };
  if (sort === "mostFlagged" && role !== "ADMIN") {
    throw new AppError("Not authorized", 403);
  }

  const stageSort = sortObj[sort] ?? { createdAt: -1 };

  const reviews = await Review.aggregate([
    {
      $match: matchStage,
    },
    {
      $lookup: {
        from: "users",
        let: { userId: "$user" },
        pipeline: [
          {
            $match: {
              $expr: userMatchStage,
            },
          },
          {
            $project: userProject,
          },
        ],
        as: "userDetails",
      },
    },
    { $addFields: { userDetails: { $arrayElemAt: ["$userDetails", 0] } } },
    ...(search ? [{ $match: { "userDetails.0": { $exists: true } } }] : []),
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        pipeline: [{ $project: { name: 1, slug: 1, productImages: 1 } }],
        as: "productDetails",
      },
    },
    {
      $addFields: {
        productDetails: { $arrayElemAt: ["$productDetails", 0] },
        helpfulYesCount: { $size: "$helpfulYes" },
        helpfulNoCount: { $size: "$helpfulNo" },
      },
    },

    ...helpfulLookUpStages,
    {
      $project: role === "ADMIN" ? adminProject : clientProject,
    },
    {
      $sort: stageSort,
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    },
  ]);

  const totalReviews = await Review.countDocuments(matchStage);

  return response(res, 200, "Reviews fetched successfully", {
    reviews,
    pagination: {
      page,
      limit,
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
    },
  });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const { id, role } = req.user;

  const { reviewId } = req.params;

  if (!mongoose.isValidObjectId(reviewId)) {
    throw new AppError(`Invalid Review Id: ${reviewId}`, 400);
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new AppError("Review not found", 404);
  }
  const isOwner = id === String(review.user);
  const isAdmin = role === "ADMIN";

  if (!isOwner && !isAdmin) {
    throw new AppError("Not authorized", 403);
  }

  await review.deleteOne();

  const result = await Review.aggregate([
    { $match: { product: review.product } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const avgRating = result[0]?.avgRating ?? 0;
  const reviewersCount = result[0]?.count ?? 0;

  await Product.findByIdAndUpdate(review.product, {
    $set: {
      avgRating: parseFloat(avgRating.toFixed(1)),
      reviewersCount,
    },
  });
  return response(res, 200, "Review deleted successfully");
});

export const editReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { role, id } = req.user;
  const { title, body, isHidden, rating, adminReply } = req.body;

  if (!mongoose.isValidObjectId(reviewId)) {
    throw new AppError(`Invalid Review Id: ${reviewId}`, 400);
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new AppError("Review not found", 404);
  }
  if (id === String(review.user)) {
    let oldRating = review.rating;
    if (title !== undefined && title !== review.title) review.title = title;
    if (body !== undefined && body !== review.body) review.body = body;
    if (rating !== undefined && rating !== review.rating)
      review.rating = rating;
    let uploadedImages = [];

    try {
      if (req.files && req.files.length > 0) {
        const currentImages = review.images.length;
        const totalImages = req.files.length + currentImages;

        if (totalImages > 5) {
          throw new AppError(`Review Images can only have 5 images`, 400);
        }
        uploadedImages = await Promise.all(
          req.files.map(async (img) => {
            const result = await uploadToCloudinary(img.buffer, "review");
            return {
              url: result.secure_url,
              publicId: result.public_id,
            };
          }),
        );
        review.images.push(...uploadedImages);
      }

      await review.save();
      if (oldRating !== review.rating) {
        const result = await Review.aggregate([
          { $match: { product: review.product } },
          {
            $group: {
              _id: null,
              avgRating: { $avg: "$rating" },
            },
          },
        ]);

        const avgRating = result[0]?.avgRating ?? 0;

        await Product.findByIdAndUpdate(review.product, {
          $set: {
            avgRating: parseFloat(avgRating.toFixed(1)),
          },
        });
      }

      return response(res, 200, "Review updated successfully", review);
    } catch (error) {
      if (uploadedImages.length > 0) {
        await Promise.all(
          uploadedImages.map((img) => deleteFileFromCloudinary(img.publicId)),
        );
      }
      throw error;
    }
  }

  if (role === "ADMIN") {
    let message = "";
    if (isHidden !== undefined) {
      review.isHidden = isHidden;
      message = "Review Hidden successfully";
    }
    if (adminReply !== undefined) {
      review.adminReply.reply = adminReply;
      review.adminReply.repliedAt = Date.now();
      message = "Added Reply to Review Successfully";
    }
    await review.save();
    return response(res, 200, message, review);
  }

  throw new AppError("Unauthorized", 403);
});

export const reviewSummary = asyncHandler(async (req, res) => {
  const { slugId } = req.params;

  const product = await Product.findOne({ slug: slugId }).select("_id");

  if (!product) {
    throw new AppError("Product Not Found", 404);
  }

  const summary = await Review.aggregate([
    {
      $match: {
        product: product._id,
      },
    },
    {
      $group: {
        _id: "$rating",
        count: {
          $sum: 1,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalReviews: {
          $sum: "$count",
        },
        totalRatingValue: {
          $sum: {
            $multiply: ["$_id", "$count"],
          },
        },
        ratings: {
          $push: {
            rating: "$_id",
            count: "$count",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalReviews: 1,
        averageRating: {
          $round: [
            {
              $divide: ["$totalRatingValue", "$totalReviews"],
            },
            1,
          ],
        },
        ratings: {
          $sortArray: {
            input: {
              $map: {
                input: "$ratings",
                as: "item",
                in: {
                  rating: "$$item.rating",
                  count: "$$item.count",
                  percentage: {
                    $round: [
                      {
                        $multiply: [
                          {
                            $divide: ["$$item.count", "$totalReviews"],
                          },
                          100,
                        ],
                      },
                      1,
                    ],
                  },
                },
              },
            },
            sortBy: {
              rating: -1,
            },
          },
        },
      },
    },
  ]);
  const ratingSummary = summary[0] || {
    totalReviews: 0,
    averageRating: 0.0,
    ratings: [],
  };

  const defaultRatings = Array.from({ length: 5 }, (_, i) => ({
    rating: 5 - i,
    count: 0,
    percentage: 0,
  }));

  const ratingsMap = new Map(
    ratingSummary.ratings.map((item) => {
      return [item.rating, item];
    }),
  );

  ratingSummary.ratings = defaultRatings.map(
    (item) => ratingsMap.get(item.rating) || item,
  );
  return response(
    res,
    200,
    "review summary fetched successfully",
    ratingSummary,
  );
});
