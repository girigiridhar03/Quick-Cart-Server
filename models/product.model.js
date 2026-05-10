import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      index: true,
      unique: true,
      lowercase: true,
    },
    brand: {
      type: String,
      required: true,
      index: true,
    },
    weight: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 1,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
    },
    mrp: {
      type: Number,
      required: true,
      min: 1,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    tags: [
      {
        type: String,
        required: true,
      },
    ],
    productImages: [
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
    stock: {
      type: Number,
      default: 0,
    },
    avgRating: {
      type: Number,
      default: 0,
    },
    reviewersCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    reportCount: { type: Number, default: 0 },
    isFlagged: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
productSchema.pre("save", function (next) {
  if (this.isModified("discount") || this.isModified("mrp")) {
    if (this.discount === 0) {
      this.price = this.mrp;
    } else {
      this.price = Math.round(this.mrp * (1 - this.discount / 100));
    }
  }
  next();
});
const Product = mongoose.model("Product", productSchema);

export default Product;
