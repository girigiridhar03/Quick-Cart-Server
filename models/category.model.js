import mongoose from "mongoose";
import { deleteFileFromCloudinary } from "../config/cloudinary.config.js";
import Product from "./product.model.js";
import SubCategory from "./subCategory.model.js";

const categorySchema = new mongoose.Schema(
  {
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
    icon: {
      type: String,
      required: true,
    },
    bgColor: {
      type: String,
      required: true,
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

const Category = mongoose.model("Category", categorySchema);

export default Category;
