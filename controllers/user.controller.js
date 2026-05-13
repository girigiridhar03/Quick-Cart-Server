import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import {
  clearCookies,
  createCSRFOptions,
  createTokenOptions,
  setAuthCookies,
} from "../utils/cookies.js";
import { asyncHandler } from "../utils/handler.js";
import bcrypt from "bcryptjs";
import response from "../utils/response.js";
import logger from "../utils/logger.js";
import mongoose from "mongoose";
import { ACCESS_TOKEN, CSRF_TOKEN, REFRESH_TOKEN } from "../utils/constant.js";
import jwt from "jsonwebtoken";
import {
  createAccessToken,
  createCSRFToken,
  createRefreshToken,
} from "../utils/jwt.js";
import {
  deleteFileFromCloudinary,
  uploadToCloudinary,
} from "../config/cloudinary.config.js";

const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;

export const register = asyncHandler(async (req, res) => {
  const { username, email, password, phoneNumber } = req.body;

  const userExist = await User.findOne({ email });

  if (userExist) {
    throw new AppError("A user with this email already exists.", 400);
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    username,
    email,
    password: hashPassword,
    phoneNumber,
  });

  const { refreshToken, refreshMaxAge, accessMaxAge } = setAuthCookies({
    res,
    userId: newUser._id,
    role: newUser.role,
    tokenVersion: newUser.tokenVersion,
  });

  const hashToken = await bcrypt.hash(refreshToken, 10);

  newUser.refreshToken = hashToken;

  await newUser.save();

  logger.success("User Registered successfully", {
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
  });

  return response(res, 201, "User registered successfully", {
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
    accessTokenExpiresAt: Date.now() + accessMaxAge,
    refreshTokenExpiresAt: Date.now() + refreshMaxAge,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const userExist = await User.findOne({ email });

  if (!userExist) {
    throw new AppError("Invalid Credentials", 400);
  }

  const isLocked = userExist.lockedUntil && userExist.lockedUntil > new Date();

  if (isLocked) {
    throw new AppError("Account is locked. Try again later", 423);
  }

  const isPassword = await bcrypt.compare(password, userExist.password);

  if (!isPassword) {
    userExist.failedLoginAttempt += 1;

    if (userExist.failedLoginAttempt >= MAX_ATTEMPTS) {
      userExist.lockedUntil = new Date(Date.now() + LOCK_TIME);
      await userExist.save();
      throw new AppError("Account is locked. Try again later", 423);
    }
    await userExist.save();
    throw new AppError("Invalid Credentials", 400);
  }

  const updatedToken = userExist.tokenVersion + 1;

  const { refreshToken, refreshMaxAge, accessMaxAge } = await setAuthCookies({
    res,
    userId: userExist._id,
    role: userExist.role,
    tokenVersion: updatedToken,
  });

  const hashToken = await bcrypt.hash(refreshToken, 10);
  userExist.failedLoginAttempt = 0;
  userExist.lockedUntil = null;
  userExist.tokenVersion = updatedToken;
  userExist.refreshToken = hashToken;
  await userExist.save();

  logger.success("User logged in successfully", {
    username: userExist.username,
    email: userExist.email,
    role: userExist.role,
  });

  return response(res, 200, "User login successfully", {
    username: userExist.username,
    email: userExist.email,
    role: userExist.role,
    accessTokenExpiresAt: Date.now() + accessMaxAge,
    refreshTokenExpiresAt: Date.now() + refreshMaxAge,
  });
});

export const userDetails = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!mongoose.isValidObjectId(userId)) {
    throw new AppError(`Invalid userId: ${userId}`, 400);
  }

  const user = await User.findById(userId).select(
    "username email profile role",
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return response(res, 200, "User Details fetched successfully", user);
});

export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, {
    $set: {
      refreshToken: null,
    },
    $inc: {
      tokenVersion: 1,
    },
  });

  clearCookies(res);

  return response(res, 200, "User logged out successfully");
});

export const refreshToken = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies?.[REFRESH_TOKEN];

  if (!oldRefreshToken) {
    throw new AppError("Unauthorized", 401);
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(oldRefreshToken, process.env.REFRESH_SECRET);
  } catch (error) {
    throw new AppError("Unauthorized", 401);
  }

  const user = await User.findById(decodedToken.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isRefreshToken = await bcrypt.compare(
    oldRefreshToken,
    user.refreshToken,
  );

  if (!isRefreshToken) {
    throw new AppError("Invalid Refresh token");
  }

  const updatedTokenVersion = user.tokenVersion + 1;

  const accessToken = createAccessToken(
    user._id,
    user.role,
    updatedTokenVersion,
  );
  const refreshToken = createRefreshToken(
    user._id,
    user.role,
    updatedTokenVersion,
  );

  const csrfToken = createCSRFToken();

  const accessMaxAge = 15 * 60 * 1000;
  const refreshMaxAge = 7 * 24 * 60 * 60 * 1000;

  res.cookie(ACCESS_TOKEN, accessToken, createTokenOptions(accessMaxAge));
  res.cookie(REFRESH_TOKEN, refreshToken, createTokenOptions(refreshMaxAge));
  res.cookie(CSRF_TOKEN, csrfToken, createCSRFOptions(refreshMaxAge));

  const bcryptToken = await bcrypt.hash(refreshToken, 10);

  user.tokenVersion = updatedTokenVersion;
  user.refreshToken = bcryptToken;

  await user.save();

  return response(res, 200, "Refreshed Token Successfully", {
    username: user.username,
    email: user.email,
    role: user.role,
    accessTokenExpiresAt: Date.now() + accessMaxAge,
    refreshTokenExpiresAt: Date.now() + refreshMaxAge,
  });
});

export const updateUserDetails = asyncHandler(async (req, res) => {
  if (!Object.keys(req.body).length) {
    throw new AppError("Please provide at least one field to update", 400);
  }

  const { username, phoneNumber } = req.body;

  const userId = req.user.id;

  const user = await User.findById(userId).select(
    "username phoneNumber profile role",
  );
  if (!req.file && !req.body.username && !req.body.phoneNumber) {
    return response(res, 400, "Please provide at least one field to update");
  }

  if (username && username !== user.username) user.username = username;
  if (phoneNumber && phoneNumber !== user.phoneNumber)
    user.phoneNumber = phoneNumber;

  const image = req.file;
  let result = null;
  let oldPublicId = null;
  if (image) {
    result = await uploadToCloudinary(image.buffer, "users");
    if (result) {
      oldPublicId = user.profile?.publicId;
      user.profile = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }
  }
  try {
    await user.save();
    if (oldPublicId) {
      await deleteFileFromCloudinary(oldPublicId);
    }
  } catch (error) {
    if (uploadedResult) {
      await deleteFileFromCloudinary(uploadedResult.public_id);
    }

    throw error;
  }

  return response(res, 200, "User Details updated successfully", user);
});
