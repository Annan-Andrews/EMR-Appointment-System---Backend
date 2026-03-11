const { sendError } = require("../utils/responseUtils");

const notFoundHandler = (req, res) => {
  return sendError(
    res,
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
  );
};

const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err);

  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, "Validation failed", 422, errors);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return sendError(
      res,
      `${field} already exists. Please use a different value.`,
      409,
    );
  }

  if (err.name === "CastError") {
    return sendError(res, `Invalid ${err.path} format`, 400);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error";

  return sendError(res, message, statusCode);
};

module.exports = { notFoundHandler, errorHandler };
