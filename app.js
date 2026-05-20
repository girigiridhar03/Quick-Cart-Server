import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import AppError from "./utils/AppError.js";
const app = express();

const noCache = (req, res, next) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Surrogate-Control": "no-store",
  });
  next();
};

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
const clientUrls = process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(",").map((origin) => origin.trim())
  : [];
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || clientUrls.includes(origin)) {
        return callback(null, true);
      }
      return callback(new AppError("Origin not allowed by CORS", 400));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);
app.use(noCache);
app.use(express.json({ limit: "10kb" }));

// App Routes
import response from "./utils/response.js";
import userRouter from "./routes/user.routes.js";
import addressRouter from "./routes/address.routes.js";
import productRouter from "./routes/product.routes.js";
import categoryRouter from "./routes/category.routes.js";
import cartRouter from "./routes/cart.routes.js";
import reviewRouter from "./routes/review.routes.js";

// Routes
app.use("/api/user", userRouter);
app.use("/api/address", addressRouter);
app.use("/api/product", productRouter);
app.use("/api/category", categoryRouter);
app.use("/api/cart", cartRouter);
app.use("/api/review", reviewRouter);
app.use((req, res) => response(res, 404, "Route not found"));

// Error Hanlder
import { errorHandler } from "./utils/handler.js";

app.use(errorHandler);

export default app;
