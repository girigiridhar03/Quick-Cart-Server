import mongoose from "mongoose";
import { asyncHandler } from "../utils/handler.js";
import AppError from "../utils/AppError.js";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import response from "../utils/response.js";

function stockMessage(productStock, quantity) {
  if (productStock >= quantity) {
    return {
      isAvailable: true,
      maxAllowedQuantity: productStock,
      message: "In Stock",
    };
  } else if (quantity > productStock && productStock > 0) {
    return {
      isAvailable: false,
      maxAllowedQuantity: productStock,
      message: `Only ${productStock} items left`,
    };
  } else if (productStock === 0) {
    return {
      isAvailable: false,
      maxAllowedQuantity: 0,
      message: "Out of stock",
    };
  }
}

export const addToCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;
  const { quantity } = req.body;

  if (!mongoose.isValidObjectId(productId)) {
    throw new AppError(`Invalid ProductId: ${productId}`, 400);
  }

  if (
    quantity === undefined ||
    isNaN(quantity) ||
    quantity <= 0 ||
    !Number.isInteger(quantity)
  ) {
    throw new AppError("Quantity must be a positive integer", 400);
  }
  const product = await Product.findById(productId).select("stock").lean();

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const existingCart = await Cart.findOne({
    user: userId,
    product: productId,
  });

  const currentQuantity = existingCart?.quantity || 0;
  const totalQuantity = currentQuantity + quantity;

  if (totalQuantity > product.stock) {
    throw new AppError(`Only ${product.stock} items available in stock`, 400);
  }

  const cart = await Cart.findOneAndUpdate(
    { user: userId, product: productId },
    {
      $inc: {
        quantity: quantity,
      },
      $setOnInsert: {
        user: userId,
        product: productId,
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
    },
  );

  return response(res, 200, "Product added to cart successfully", cart);
});

export const descreaseItemQuantity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(`Invalid ProductId: ${id}`, 400);
  }

  const item = await Cart.findOneAndUpdate(
    {
      product: id,
      user: userId,
      quantity: { $gt: 0 },
    },
    {
      $inc: {
        quantity: -1,
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (!item) {
    throw new AppError("Item not found", 404);
  }

  return response(res, 200, `Quantity decreased to: ${item.quantity}`);
});

export const getAllCarts = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const allProducts = await Cart.find({ user: userId })
    .populate(
      "product",
      "name brand stock weight discount mrp price productImages",
    )
    .select("-user")
    .lean();

  const updatedProducts = allProducts
    .filter((item) => item.product)
    .map((item) => ({
      ...item,
      availability: stockMessage(item.product.stock, item.quantity),
    }));

  const { cartTotal, totalDiscount, totalMrp } = updatedProducts.reduce(
    (acc, curr) => {
      return {
        cartTotal: acc.cartTotal + curr.product.price * curr.quantity,
        totalDiscount:
          acc.totalDiscount + curr.product.discount * curr.quantity,
        totalMrp: acc.totalMrp + curr.product.mrp * curr.quantity,
      };
    },
    { cartTotal: 0, totalDiscount: 0, totalMrp: 0 },
  );

  return response(res, 200, "Fetched cart details", {
    products: updatedProducts,
    cartTotal,
    totalDiscount,
    totalMrp,
  });
});

export const deleteCartItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(`Invalid Product Id: ${id}`, 400);
  }

  const cartItem = await Cart.findOneAndDelete({ product: id });

  if (!cartItem) {
    throw new AppError("Cart Item not found", 404);
  }

  return response(res, 200, "Cart item deleted successfully");
});

export const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await Cart.deleteMany({ user: userId });

  if (result.deletedCount === 0) {
    return response(res, 200, "Cart is already empty", []);
  }

  return response(res, 200, "Cart cleared successfully", []);
});
