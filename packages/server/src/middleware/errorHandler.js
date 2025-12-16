const { logger } = require('../utils/logger');

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  logger.error('Error handler caught:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Default error response
  const status = err.status || err.statusCode || 500;
  const response = {
    error: err.code || 'internal_server_error',
    message: err.message || 'An unexpected error occurred',
  };

  // Add details in development
  if (process.env.NODE_ENV !== 'production' && err.details) {
    response.details = err.details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
}

/**
 * Create a custom error
 */
class AppError extends Error {
  constructor(message, status = 500, code = 'error', details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async route handler wrapper
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  AppError,
  asyncHandler,
};
