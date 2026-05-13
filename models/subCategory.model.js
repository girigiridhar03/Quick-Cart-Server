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
    },
    slug: {
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

subCategorySchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;
  try {
    const products = await Product.find({ subCategory: doc._id });
    await Promise.all(
      products.flatMap((product) =>
        product.productImages.map((img) =>
          deleteFileFromCloudinary(img.publicId),
        ),
      ),
    );
    await Product.deleteMany({ subCategory: doc._id });
  } catch (error) {
    logger.error("Cascade delete failed", { subCategoryId: doc._id, error });
  }
});

const SubCategory = mongoose.model("SubCategory", subCategorySchema);

export default SubCategory;
