/**
 * Centralized Error Handling Middleware
 * Provides standardized error structure and suppresses raw stack traces in production.
 */

class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
    code: "NOT_FOUND",
  });
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error occurred.";
  let code = err.code || "INTERNAL_ERROR";

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 422;
    code = "VALIDATION_ERROR";
    const messages = Object.values(err.errors).map((val) => val.message);
    message = `Validation failed: ${messages.join(", ")}`;
  }

  // Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    code = "DUPLICATE_ENTRY";
    const field = Object.keys(err.keyValue || {})[0] || "record";
    message = `A ${field} with that value already exists.`;
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    code = "INVALID_ID";
    message = `Invalid format for field: ${err.path}`;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    code = "INVALID_TOKEN";
    message = "Invalid or expired authorization token.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    code = "TOKEN_EXPIRED";
    message = "Authorization token has expired. Please sign in again.";
  }

  // Payload too large
  if (err.type === "entity.too.large" || err.status === 413) {
    statusCode = 413;
    code = "PAYLOAD_TOO_LARGE";
    message = "Request payload exceeds allowed size limit.";
  }

  // Log server errors
  if (statusCode >= 500) {
    console.error("🔥 [Server Error]:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = {
  AppError,
  notFoundHandler,
  errorHandler,
};
