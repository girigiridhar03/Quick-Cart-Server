import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(express.json({ limit: "10kb" }));

// App Routes
import response from "./utils/response.js";
import userRouter from "./routes/user.routes.js";
app.use("/api/user", userRouter);
app.use((req, res) => response(res, 404, "Route not found"));

// Error Hanlder
import { errorHandler } from "./utils/handler.js";

app.use(errorHandler);

export default app;
