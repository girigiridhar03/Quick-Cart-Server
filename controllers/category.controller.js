import Category from "../models/category.model.js";
import { asyncHandler } from "../utils/handler.js";
import slugify from "slugify";
import response from "../utils/response.js";
import AppError from "../utils/AppError.js";
import mongoose from "mongoose";
import SubCategory from "../models/subCategory.model.js";
import Product from "../models/product.model.js";

export const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, bgColor } = req.body;

  const nameSlug = slugify(name, { lower: true, strict: true, trim: true });

  const newCategory = await Category.create({
    name: name.toLowerCase(),
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

  const category = await Category.findById(id);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  await Promise.all([
    Category.findByIdAndUpdate(id, { isActive: false }),
    SubCategory.updateMany({ category: id }, { isActive: false }),
    Product.updateMany({ category: id }, { isActive: false }),
  ]);

  return response(res, 200, "Category deleted successfully");
});
export const createSubCategory = asyncHandler(async (req, res) => {
  const { category, name } = req.body;

  if (!mongoose.isValidObjectId(category)) {
    throw new AppError(`Invalid Category Id: ${category}`, 400);
  }

  const nameSlug = slugify(name, { lower: true, strict: true, trim: true });

  const newSubCategory = await SubCategory.create({
    category,
    name: name.toLowerCase(),
    slug: nameSlug,
  });

  return response(res, 201, "SubCategory created successfully", newSubCategory);
});

export const deleteSubCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(`Invalid SubCategory Id: ${id}`, 400);
  }

  const subCategory = await SubCategory.findById(id);

  if (!subCategory) {
    throw new AppError("SubCategory not found", 404);
  }

  await Promise.all([
    SubCategory.findByIdAndUpdate(id, { isActive: false }),
    Product.updateMany({ subCategory: id }, { isActive: false }),
  ]);

  return response(res, 200, "SubCategory deleted successfully");
});

export const updateCategory = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!Object.keys(req.body).length) {
    throw new AppError("Please provide at least one field to update", 400);
  }
  const { name, icon, bgColor, isActive } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(`Invalid Category Id: ${id}`, 400);
  }

  const category = await Category.findById(id);

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  if (name && name !== category.name) {
    const nameSlug = slugify(name, {
      lower: true,
      trim: true,
      strict: true,
    });
    category.name = name;
    category.slug = nameSlug;
  }

  if (icon && icon !== category.icon) category.icon = icon;

  if (bgColor && bgColor !== category.bgColor) category.bgColor = bgColor;

  if (typeof isActive !== "undefined" && isActive !== category.isActive) {
    await Promise.all([
      SubCategory.updateMany({ category: id }, { $set: { isActive } }),

      Product.updateMany({ category: id }, { $set: { isActive } }),
    ]);

    category.isActive = isActive;
  }

  await category.save();

  return response(res, 200, "Category updated successfully", category);
});

export const updateSubCategory = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!Object.keys(req.body).length) {
    throw new AppError("Please provide at least one field to update", 400);
  }

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(`Invalid Subcategory Id: ${id}`, 400);
  }

  const { name, category: categoryId, isActive } = req.body;

  const subCategory = await SubCategory.findById(id);

  if (!subCategory) {
    throw new AppError("SubCategory not found", 404);
  }

  if (name && name !== subCategory.name) {
    const nameSlug = slugify(name, {
      lower: true,
      trim: true,
      strict: true,
    });
    subCategory.name = name;
    subCategory.slug = nameSlug;
  }

  if (categoryId && categoryId !== String(subCategory.category)) {
    if (!mongoose.isValidObjectId(categoryId)) {
      throw new AppError(`Invalid Category Id: ${categoryId}`, 400);
    }

    const categoryExist = await Category.findById(categoryId);

    if (!categoryExist) {
      throw new AppError(`Category not found`, 404);
    }

    subCategory.category = categoryId;
  }

  if (typeof isActive !== "undefined" && isActive !== subCategory.isActive) {
    await Promise.all([
      Product.updateMany({ subCategory: id }, { $set: { isActive } }),
    ]);

    subCategory.isActive = isActive;
  }

  await subCategory.save();
  return response(res, 200, "SubCategory updated successfully", subCategory);
});

export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true });

  return response(res, 200, "Categories fetched successfully", categories);
});

export const getAllSubCategories = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(`Invalid SubCategory Id: ${id}`, 400);
  }

  const subCategories = await SubCategory.find({
    isActive: true,
    category: id,
  }).select("name slug _id");

  return response(res, 200, "Subcategories fetched", subCategories);
});
