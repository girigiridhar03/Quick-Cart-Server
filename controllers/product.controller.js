import mongoose from "mongoose";
import {
  deleteFileFromCloudinary,
  uploadToCloudinary,
} from "../config/cloudinary.config.js";
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

export const updateProduct = asyncHandler(async (req, res) => {
  if (!Object.keys(req.body).length && (!req.files || req.files.length === 0)) {
    throw new AppError("Please provide at least one field to update", 400);
  }

  const id = req.params.id;
  const {
    name,
    brand,
    weight,
    mrp,
    discount,
    category: categoryId,
    subCategory: subCategoryId,
    description,
    tags,
    stock,
    isActive,
  } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(`Invalid Product Id: ${id}`, 400);
  }

  const product = await Product.findById(id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (name && name !== product.name) {
    const nameSlug = slugify(name, {
      lower: true,
      strict: true,
      trim: true,
    });
    product.name = name;
    product.slug = nameSlug;
  }

  if (brand && brand !== product.brand) {
    product.brand = brand;
  }

  if (weight && weight !== product.weight) {
    product.weight = weight;
  }

  if (typeof mrp !== "undefined" && mrp !== product.mrp) {
    product.mrp = mrp;
  }

  if (typeof discount !== "undefined" && discount !== product.discount) {
    product.discount = discount;
  }

  if (categoryId && categoryId !== String(product.category)) {
    if (!mongoose.isValidObjectId(categoryId)) {
      throw new AppError(`Invalid Category Id: ${categoryId}`, 400);
    }
    const categoryExist = await Category.findById(categoryId);
    if (!categoryExist) {
      throw new AppError("Category not found", 404);
    }

    product.category = categoryId;
  }

  if (subCategoryId && subCategoryId !== String(product.subCategory)) {
    if (!mongoose.isValidObjectId(subCategoryId)) {
      throw new AppError(`Invalid Subcategory Id: ${subCategoryId}`, 400);
    }

    const subCategoryExist = await SubCategory.findById(subCategoryId);
    if (!subCategoryExist) {
      throw new AppError("SubCategory not found", 404);
    }

    product.subCategory = subCategoryId;
  }

  if (tags) {
    product.tags = tags;
  }

  if (typeof stock !== "undefined" && stock !== product.stock) {
    product.stock = stock;
  }

  if (description && description !== product.description) {
    product.description = description;
  }

  if (typeof isActive !== "undefined" && isActive !== product.isActive) {
    product.isActive = isActive;
  }

  let uploadedImages = [];
  if (req.files && req.files.length > 0) {
    if (product.productImages.length + req.files.length > 5) {
      throw new AppError("Product can only have 5 images", 400);
    }
    try {
      uploadedImages = await Promise.all(
        req.files.map(async (item) => {
          const result = await uploadToCloudinary(item.buffer);

          return {
            url: result.secure_url,
            publicId: result.public_id,
          };
        }),
      );

      product.productImages.push(...uploadedImages);
    } catch (error) {
      if (uploadedImages.length > 0) {
        await Promise.all(
          uploadedImages.map((item) => deleteFileFromCloudinary(item.publicId)),
        );
      }
      throw error;
    }
  }

  try {
    await product.save();
  } catch (error) {
    if (uploadedImages.length > 0) {
      await Promise.all(
        uploadedImages.map((item) => deleteFileFromCloudinary(item.publicId)),
      );
    }
    throw error;
  }

  return response(res, 200, "Product updated successfully", product);
});

export const getAllProducts = asyncHandler(async (req, res) => {
  const {
    brand,
    category,
    subCategory,
    minPrice,
    maxPrice,
    inStock,
    search,
    sortBy,
    page = 1,
    limit = 20,
    isActive = true,
  } = req.query;

  let query = {};

  if (brand) {
    query.brand = {
      $regex: brand,
      $options: "i",
    };
  }

  if (category) {
    if (!mongoose.isValidObjectId(category)) {
      throw new AppError(`Invalid Category Id: ${category}`, 400);
    }
    query.category = category;
  }

  if (subCategory) {
    if (!mongoose.isValidObjectId(subCategory)) {
      throw new AppError(`Invalid subCategory Id: ${subCategory}`, 400);
    }
    query.subCategory = subCategory;
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (inStock === "true") query.sock = { $gt: 0 };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
    ];
  }

  const sortOptions = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    newest: { createdAt: -1 },
    popularity: { sold: -1 },
  };
  const sort = sortOptions[sortBy] || { createdAt: -1 };

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("category", "name slug bgColor icon")
      .populate("subCategory", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(query),
  ]);

  return response(res, 200, "Products fetched successfully", {
    products,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

export const getAllBrands = asyncHandler(async (req, res) => {
  const brands = await Product.find({}).select("brand");

  return response(res, 200, "Brands fetched successfully", brands);
});
