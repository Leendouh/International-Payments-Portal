/**
 * Content-Type Validation Middleware
 * Ensures all requests have proper content-type headers
 */

const contentTypeValidation = (req, res, next) => {
  // Skip validation for GET, DELETE, and HEAD requests
  if (['GET', 'DELETE', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip validation for authentication and validation endpoints
  if (req.path.includes('/api/auth/') || req.path.includes('/api/employee/login')) {
    return next();
  }

  // Validate content-type for POST, PUT, PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');

    // Allow JSON content-type
    if (contentType && contentType.includes('application/json')) {
      return next();
    }

    // Allow multipart/form-data for file uploads
    if (contentType && contentType.includes('multipart/form-data')) {
      return next();
    }

    // Allow application/x-www-form-urlencoded
    if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
      return next();
    }

    // Reject invalid content-types
    return res.status(415).json({
      error: 'Unsupported Media Type',
      code: 'UNSUPPORTED_MEDIA_TYPE',
      message: 'Content-Type must be application/json, multipart/form-data, or application/x-www-form-urlencoded'
    });
  }

  next();
};

module.exports = contentTypeValidation;
