/**
 * Global error handling middleware
 * Catches all errors and returns standardized error response
 */
const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err);

  const errorResponse = {
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Database errors
  if (err.code && err.code.startsWith('23')) {
    errorResponse.error = 'Database constraint violation';
    switch (err.code) {
      case '23505':
        errorResponse.error = 'Duplicate entry';
        break;
      case '23503':
        errorResponse.error = 'Foreign key violation';
        break;
      case '23502':
        errorResponse.error = 'Not null violation';
        break;
    }
    return res.status(400).json(errorResponse);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    errorResponse.error = 'Invalid token';
    return res.status(401).json(errorResponse);
  }

  if (err.name === 'TokenExpiredError') {
    errorResponse.error = 'Token expired';
    return res.status(401).json(errorResponse);
  }

  // Validation errors
  if (err.validationErrors) {
    errorResponse.error = 'Validation failed';
    errorResponse.details = err.validationErrors;
    return res.status(400).json(errorResponse);
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found middleware
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};

