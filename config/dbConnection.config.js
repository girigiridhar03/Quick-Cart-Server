import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    logger.db("DB connected successfully 🔗", {
      host: mongoose.connection.host,
      database: mongoose.connection.name,
    });
  } catch (error) {
    logger.error(`DB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectToDB;
