import mongoose from "mongoose";
import Address from "../models/adress.model.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/handler.js";
import response from "../utils/response.js";

export const addAddress = asyncHandler(async (req, res) => {
  const {
    street,
    state,
    pincode,
    city,
    label,
    landmark,
    isDefault = false,
  } = req.body;
  const userId = req.user.id;

  const hasAddress = await Address.exists({ user: userId });

  let defaultValue = isDefault;

  if (!hasAddress) {
    defaultValue = true;
  }

  if (defaultValue) {
    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
  }

  const newAddress = await Address.create({
    user: userId,
    street,
    state,
    pincode,
    city,
    label,
    landmark,
    isDefault: defaultValue,
  });

  return response(res, 201, "New address added successfully", newAddress);
});

export const getAllAddress = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const allAddress = await Address.find({ user: userId }).sort({
    isDefault: -1,
    createdAt: -1,
  });

  return response(res, 200, "Address fetched successfully", allAddress);
});

export const updateAddress = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!Object.keys(req.body).length) {
    throw new AppError("Please provide at least one field to update", 400);
  }
  const {
    street,
    state,
    pincode,
    city,
    label,
    landmark,
    isDefault = false,
  } = req.body;
  const userId = req.user.id;

  if (!id) {
    throw new AppError("Address Id is required", 400);
  }

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(`Invalid Address Id: ${id}`, 400);
  }

  const address = await Address.findOne({
    _id: id,
    user: userId,
  });

  if (!address) {
    throw new AppError("Address not found", 404);
  }

  if (typeof isDefault !== "undefined" && typeof isDefault === "boolean") {
    if (isDefault) {
      await Address.updateMany(
        { user: userId },
        { $set: { isDefault: false } },
      );
    }

    address.isDefault = isDefault;
  }

  if (street && street !== address.street) address.street = street;
  if (state && state !== address.state) address.state = state;
  if (pincode && pincode !== address.pincode) address.pincode = pincode;
  if (city && city !== address.city) address.city = city;
  if (label && label !== address.label) address.label = label;
  if (landmark && landmark !== address.landmark) address.landmark = landmark;

  await address.save();

  return response(res, 200, "Address updated successfully", address);
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;
  if (!id) {
    throw new AppError("Address Id is required", 400);
  }

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(`Invalid Address Id: ${id}`, 400);
  }

  const address = await Address.findOne({ user: userId, _id: id });

  if (!address) {
    throw new AppError("Address not found", 404);
  }

  const wasDefault = address.isDefault;

  await address.deleteOne();

  if (wasDefault) {
    const anotherAddress = await Address.findOne({ user: userId });
    if (anotherAddress) {
      anotherAddress.isDefault = true;
      await anotherAddress.save();
    }
  }

  return response(res, 200, "Address Deleted Successfully");
});
