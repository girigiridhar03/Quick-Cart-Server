import { v2 as cloudinary } from "cloudinary";
import { createReadStream } from "streamifier";
import AppError from "../utils/AppError.js";
import { config } from "dotenv";
import logger from "../utils/logger.js";
config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

export const uploadToCloudinary = async (fileBuffer, folder = "products") => {
  if (!fileBuffer) throw new AppError("File Buffer is required", 400);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `quickCart/${folder}`,
        resource_type: "auto",
        transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
      },
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      },
    );

    createReadStream(fileBuffer).pipe(uploadStream);
  });
};

export const deleteFileFromCloudinary = async (publicId) => {
  if (!publicId) throw new AppError("publicId is required", 400);

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error("file delete failed");
    throw error;
  }
};
