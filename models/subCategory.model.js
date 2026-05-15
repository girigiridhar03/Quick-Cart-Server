import mongoose from "mongoose";
import Product from "./product.model.js";
import { deleteFileFromCloudinary } from "../config/cloudinary.config.js";

const subCategorySchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const SubCategory = mongoose.model("SubCategory", subCategorySchema);

export default SubCategory;
