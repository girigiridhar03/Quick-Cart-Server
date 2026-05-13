import mongoose from "mongoose";
import { deleteFileFromCloudinary, uploadToCloudinary } from "../config/cloudinary.config.js";
import Product from "../models/product.model.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/handler.js";
import slugify from "slugify";
import Category from "../models/category.model.js";
import SubCategory from "../models/subCategory.model.js";
import response from "../utils/response.js";

export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    brand,
    weight,
    mrp,
    discount,
    category,
    subCategory,
    description,
    tags,
    stock,
  } = req.body;

  if (!mongoose.isValidObjectId(category)) {
    throw new AppError(`Invalid Category Id: ${category}`, 400);
  }
  if (!mongoose.isValidObjectId(subCategory)) {
    throw new AppError(`Invalid Category Id: ${subCategory}`, 400);
  }

  const [categoryExist, subCategoryExist] = await Promise.all([
    Category.findById(category),
    SubCategory.findById(subCategory),
  ]);

  if (!categoryExist) {
    throw new AppError("Category not found", 404);
  }

  if (!subCategoryExist) {
    throw new AppError("SubCategory not found", 404);
  }

  const files = req.files;

  if (!files || !files?.length) {
    throw new AppError(`Product Images required`, 400);
  }

  let uploadedImages = [];

  try {
    uploadedImages = await Promise.all(
      files.map(async (item) => {
        const result = await uploadToCloudinary(item.buffer);

        return {
          url: result.secure_url,
          publicId: result.public_id,
        };
      }),
    );
  } catch (error) {
    if (uploadedImages.length > 0) {
      await Promise.all(
        uploadedImages.map(
          async (item) => await deleteFileFromCloudinary(item.publicId),
        ),
      );
    }
    throw error;
  }

  const nameSlug = slugify(name, {
    lower: true,
    trim: true,
    strict: true,
  });

  const newProduct = new Product({
    name,
    slug: nameSlug,
    brand,
    weight,
    mrp,
    discount,
    category,
    subCategory,
    description,
    tags,
    stock,
    productImages: uploadedImages,
  });
  try {
    await newProduct.save();
  } catch (error) {
    await Promise.all(
      uploadedImages.map((item) => deleteFileFromCloudinary(item.publicId)),
    );
    throw error;
  }

  return response(res, 201, "Product Created Successfully", newProduct);
});
