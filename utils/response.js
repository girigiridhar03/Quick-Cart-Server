import AppError from "./AppError.js";

const response = (res, statusCode, message, data = null) => {
  if (!res) {
    throw new AppError("res is required for response function", 400);
  }

  const obj = {
    status: statusCode,
    success: statusCode < 400,
    message,
    ...(data != null || data !== undefined ? { data } : {}),
  };

  return res.status(statusCode).json(obj);
};


export default response