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

categorySchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;
  try {
    const products = await Product.find({ category: doc._id });
    await Promise.all(
      products.flatMap((product) =>
        product.productImages.map((img) =>
          deleteFileFromCloudinary(img.publicId),
        ),
      ),
    );
    await SubCategory.deleteMany({ category: doc._id });
    await Product.deleteMany({ category: doc._id });
  } catch (error) {
    logger.error("Cascade delete failed", { categoryId: doc._id, error });
  }
});

const Category = mongoose.model("Category", categorySchema);

export default Category;
