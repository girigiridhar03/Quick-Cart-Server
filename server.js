import { config } from "dotenv";
config();
import connectToDB from "./config/dbConnection.config.js";
import app from "./app.js";
import logger from "./utils/logger.js";

connectToDB()
  .then(() =>
    app.listen(process.env.PORT, () =>
      logger.success(`Server is running on PORT: ${process.env.PORT} 🚀`),
    ),
  )
  .catch((err) => {
    logger.error(`Connection failed: ${err.message}`);
  });
