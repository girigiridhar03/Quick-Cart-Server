import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["Flat", "Percentage"],
  },
  discount: {
    type: Number,
    min: 1,
    required: true,
  },
  minOrder: {
    type: Number,
    default: 0,
  },
  maxDiscount: {
    type: Number,
    default: null,
  },
  maxUsage: {
    type: Number,
    default: 1,
  },
  maxPerUser: {
    type: Number,
    default: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  expireAt: {
    type: Date,
    default: null,
  },
});

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
