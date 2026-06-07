const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';

/**
 * Employee Authentication Middleware
 * Verifies JWT tokens for employee routes
 */

const authenticateEmployeeToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      code: 'TOKEN_MISSING'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }

    // Check if this is an employee token
    if (decoded.type !== 'employee') {
      return res.status(403).json({
        error: 'Access denied. Employee token required.',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    req.employee = decoded;
    next();
  });
};

/**
 * Role-based access control middleware
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.employee) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.employee.role)) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

module.exports = {
  authenticateEmployeeToken,
  requireRole
};
