import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import { clearCookies, setAuthCookies } from "../utils/cookies.js";
import { asyncHandler } from "../utils/handler.js";
import bcrypt from "bcryptjs";
import response from "../utils/response.js";
import logger from "../utils/logger.js";
import mongoose from "mongoose";

const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;

export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const userExist = await User.findOne({ email });

  if (userExist) {
    throw new AppError("A user with this email already exists.", 400);
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    username,
    email,
    password: hashPassword,
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
    refreshMaxAge,
    accessMaxAge,
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
    refreshMaxAge,
    accessMaxAge,
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
