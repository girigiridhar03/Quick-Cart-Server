import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
      },
    ],
    adminReplay: {
      reply: String,
      repliedAt: Date,
    },
    helpfulYes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    helpfulNo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isHidden: {
      type: Boolean,
      default: false,
    },
    flagCount: {
      type: Number,
      default: 0,
    },
    isFlaggged: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

reviewSchema.pre("save", function (next) {
  if (this.flagCount >= 5) {
    this.isFlagged = true;
  }
  next();
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
