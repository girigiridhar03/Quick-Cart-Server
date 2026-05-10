import jwt from "jsonwebtoken";
import crypto from "crypto";

export const createAccessToken = (userId, role, tokenVersion) => {
  return jwt.sign(
    { id: userId, role, tokenVersion },
    process.env.ACCESS_SECRET,
    { expiresIn: "15m" },
  );
};

export const createRefreshToken = (userId, role, tokenVersion) => {
  return jwt.sign(
    { id: userId, role, tokenVersion },
    process.env.REFRESH_SECRET,
    { expiresIn: "7d" },
  );
};

export const createCSRFToken = () => {
  return crypto.randomBytes(32).toString("hex");
};
