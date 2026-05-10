import mongoose from "mongoose";

const couponUsageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
    },
    usedCount: {
      type: Number,
      default: 1,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Oder",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);


const CouponUsage = mongoose.model("CouponUsage",couponUsageSchema);

export default CouponUsage