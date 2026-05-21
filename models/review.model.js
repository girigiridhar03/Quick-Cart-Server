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
          default: null,
        },
        publicId: {
          type: String,
          default: null,
        },
      },
    ],
    adminReply: {
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
    isFlagged: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({product: 1, createdAt : -1})

reviewSchema.pre("validate", function () {
  if (this.isModified("flagCount") && this.flagCount >= 5) {
    this.isFlagged = true;
  }
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
