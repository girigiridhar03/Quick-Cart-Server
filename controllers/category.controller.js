import Category from "../models/category.model.js";
import { asyncHandler } from "../utils/handler.js";
import slugify from "slugify";
import response from "../utils/response.js";
import AppError from "../utils/AppError.js";
import mongoose from "mongoose";
import SubCategory from "../models/subCategory.model.js";

export const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, bgColor } = req.body;

  const nameSlug = slugify(name, { lower: true, strict: true, trim: true });

  const newCategory = await Category.create({
    name,
    slug: nameSlug,
    icon,
    bgColor,
  });

  return response(res, 201, "Category created Successfully", newCategory);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(`Invalid Category Id: ${id}`, 400);
  }

  const deletedCategory = await Category.findOneAndDelete({ _id: id });

  if (!deletedCategory) {
    throw new AppError("Category not found", 404);
  }

  return response(res, 200, "Category deleted Successfully");
});

export const createSubCategory = asyncHandler(async (req, res) => {
  const { category, name } = req.body;

  if (!mongoose.isValidObjectId(category)) {
    throw new AppError(`Invalid Category Id: ${category}`, 400);
  }

  const nameSlug = slugify(name, { lower: true, strict: true, trim: true });

  const newSubCategory = await SubCategory.create({
    category,
    name,
    slug: nameSlug,
  });

  return response(res, 201, "SubCategory created successfully", newSubCategory);
});
