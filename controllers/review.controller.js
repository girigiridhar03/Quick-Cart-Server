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
  const product = await Product.findOne({
    slug: slugId,
    isActive: true,
  });
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  const reviewExist = await Review.findOne({
    user: userId,
    product: product._id,
  });
  if (reviewExist) {
    throw new AppError(
      `You have already reviewed this product. Please edit your existing review if you'd like to make changes.`,
      409,
    );
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
  const { role, id } = req?.user ?? {};
  const { search, sort, isHidden, rating } = req.query;

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

  if (rating && Number(rating) > 0 && Number(rating) <= 5) {
    matchStage.rating = Number(rating);
  }

  if (role !== "ADMIN") {
    matchStage.isHidden = false;
  }

  if (
    isHidden !== undefined &&
    ["true", "false"].includes(isHidden) &&
    role === "ADMIN"
  ) {
    matchStage.isHidden = isHidden === "true";
  }

  const userMatchStage = {
    $eq: ["$_id", "$$userId"],
  };

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
    isHelpYes: 1,
    isHelpNo: 1,
    createdAt: 1,
    isReported: 1,
    isMyReview: 1,
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
    isHelpYes: 1,
    isHelpNo: 1,
    createdAt: 1,
    isReported: 1,
    isMyReview: 1,
  };

  const sortObj = {
    latest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    highestRated: { rating: -1 },
    lowestRated: { rating: 1 },
    mostFlagged: { flagCount: -1 },
    mostHelpful: { helpfulYesCount: -1 },
  };

  if (sort === "mostFlagged" && role !== "ADMIN") {
    throw new AppError("Not authorized", 403);
  }

  const stageSort = sortObj[sort] ?? { createdAt: -1 };

  const result = await Review.aggregate([
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
    {
      $addFields: {
        userDetails: {
          $arrayElemAt: ["$userDetails", 0],
        },
      },
    },

    ...(search?.trim()
      ? [
          {
            $match: {
              $or: [
                {
                  title: {
                    $regex: search.trim(),
                    $options: "i",
                  },
                },
                {
                  body: {
                    $regex: search.trim(),
                    $options: "i",
                  },
                },
                {
                  "userDetails.username": {
                    $regex: search.trim(),
                    $options: "i",
                  },
                },
                ...(role === "ADMIN"
                  ? [
                      {
                        "userDetails.email": {
                          $regex: search.trim(),
                          $options: "i",
                        },
                      },
                      {
                        "userDetails.phoneNumber": {
                          $regex: search.trim(),
                          $options: "i",
                        },
                      },
                    ]
                  : []),
              ],
            },
          },
        ]
      : []),

    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              name: 1,
              slug: 1,
              productImages: 1,
            },
          },
        ],
        as: "productDetails",
      },
    },
    ...(id
      ? [
          {
            $lookup: {
              from: "reports",
              let: {
                reportId: "$_id",
                loggedUserId: new mongoose.Types.ObjectId(id),
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$targetedId", "$$reportId"] },
                        { $eq: ["$reportedBy", "$$loggedUserId"] },
                        { $eq: ["$targetType", "Review"] },
                      ],
                    },
                  },
                },
              ],
              as: "reportDetails",
            },
          },
        ]
      : []),

    {
      $addFields: {
        productDetails: {
          $arrayElemAt: ["$productDetails", 0],
        },
        helpfulYesCount: {
          $size: "$helpfulYes",
        },
        helpfulNoCount: {
          $size: "$helpfulNo",
        },
        isReported: id ? { $gt: [{ $size: "$reportDetails" }, 0] } : false,

        ...(id
          ? {
              isHelpYes: {
                $in: [new mongoose.Types.ObjectId(id), "$helpfulYes"],
              },
              isHelpNo: {
                $in: [new mongoose.Types.ObjectId(id), "$helpfulNo"],
              },
              isMyReview: {
                $eq: ["$user", new mongoose.Types.ObjectId(id)],
              },
            }
          : {
              isHelpYes: false,
              isHelpNo: false,
              isMyReview: false,
              isReported: false,
            }),
      },
    },

    ...helpfulLookUpStages,

    {
      $project: role === "ADMIN" ? adminProject : clientProject,
    },

    {
      $facet: {
        reviews: [
          {
            $sort: {
              isMyReview: -1,
              ...stageSort,
            },
          },
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
        ],

        totalCount: [
          {
            $count: "count",
          },
        ],
      },
    },
  ]);

  const reviews = result[0].reviews;
  const totalReviews = result[0].totalCount[0]?.count || 0;

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

  await Promise.all(
    review.images.map((img) => deleteFileFromCloudinary(img.publicId)),
  );

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
  const { id } = req?.user ?? {};
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
      $addFields: {
        isMyReview: {
          $eq: ["$user", new mongoose.Types.ObjectId(id)],
        },
      },
    },
    {
      $group: {
        _id: "$rating",
        count: {
          $sum: 1,
        },
        myReviewExists: {
          $max: "$isMyReview",
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
        isMyReview: {
          $max: "$myReviewExists",
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
        isMyReview: 1,
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
    isMyReview: false,
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

export const deleteReviewImage = asyncHandler(async (req, res) => {
  const { reviewId, imageId } = req.params;
  const { id } = req.user;

  if (!mongoose.isValidObjectId(reviewId)) {
    throw new AppError(`Invalid review ID: ${reviewId}`, 400);
  }

  if (!mongoose.isValidObjectId(imageId)) {
    throw new AppError(`Invalid image ID: ${imageId}`, 400);
  }

  const review = await Review.findOne({
    user: id,
    _id: reviewId,
    "images._id": imageId,
  });

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  const deleteImg = review.images.find(
    (item) => item._id.toString() === imageId,
  );

  await deleteFileFromCloudinary(deleteImg.publicId);

  await Review.findByIdAndUpdate(reviewId, {
    $pull: {
      images: { _id: imageId },
    },
  });

  return response(res, 200, "Review Image Deleted Successfully");
});

export const helpfulReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { id } = req?.user ?? {};
  const { action } = req?.body;
  if (!mongoose.isValidObjectId(reviewId)) {
    throw new AppError(`Invalid Review ID: ${reviewId}`, 400);
  }

  if (!action || !["yes", "no"].includes(action)) {
    throw new AppError("Action must be either yes or no", 400);
  }

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  let alreadyVoted = false;
  let message = "";

  if (action === "yes") {
    alreadyVoted = review.helpfulYes.some(
      (item) => item.toString() === id.toString(),
    );

    if (alreadyVoted) {
      review.helpfulYes = review.helpfulYes.filter(
        (item) => item.toString() !== id.toString(),
      );
      message = "Helpful vote removed successfully";
    } else {
      review.helpfulYes.push(id);

      review.helpfulNo = review.helpfulNo.filter(
        (item) => item.toString() !== id.toString(),
      );
      message = "Marked review as helpful";
    }
  }
  if (action === "no") {
    alreadyVoted = review.helpfulNo.some(
      (item) => item.toString() === id.toString(),
    );

    if (alreadyVoted) {
      review.helpfulNo = review.helpfulNo.filter(
        (item) => item.toString() !== id.toString(),
      );
      message = "Helpful feedback removed successfully";
    } else {
      review.helpfulNo.push(id);
      review.helpfulYes = review.helpfulYes.filter(
        (item) => item.toString() !== id.toString(),
      );
      message = "Marked review as not helpful";
    }
  }

  await review.save();
  return response(res, 200, message, review);
});
