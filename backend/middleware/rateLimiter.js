const rateLimit = require('express-rate-limit');
const { auditLog } = require('../utils/logger');

/**
 * Rate Limiting Middleware
 * Implements DDoS protection as per Task 1 requirements
 */

// General rate limiter for all requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    auditLog('RATE_LIMIT_EXCEEDED', null, req.ip, req.get('User-Agent'), {
      endpoint: req.path,
      method: req.method
    });
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 auth requests per minute
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    auditLog('AUTH_RATE_LIMIT_EXCEEDED', null, req.ip, req.get('User-Agent'), {
      endpoint: req.path,
      method: req.method,
      email: req.body.email
    });
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '1 minute'
    });
  }
});

// Very strict rate limiter for registration
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 registrations per hour
  message: {
    error: 'Too many registration attempts from this IP, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    auditLog('REGISTRATION_RATE_LIMIT_EXCEEDED', null, req.ip, req.get('User-Agent'), {
      endpoint: req.path,
      method: req.method,
      email: req.body.email
    });
    res.status(429).json({
      error: 'Too many registration attempts from this IP, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

// Payment endpoint rate limiter
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // Limit each IP to 50 payment requests per minute
  message: {
    error: 'Too many payment requests, please try again later.',
    retryAfter: '1 minute'
  },
  keyGenerator: (req) => {
    // Rate limit by both IP and user ID if authenticated
    return req.user ? `user_${req.user.id}` : req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    auditLog('PAYMENT_RATE_LIMIT_EXCEEDED', req.user?.id, req.ip, req.get('User-Agent'), {
      endpoint: req.path,
      method: req.method,
      amount: req.body.amount,
      currency: req.body.currency
    });
    res.status(429).json({
      error: 'Too many payment requests, please try again later.',
      retryAfter: '1 minute'
    });
  }
});

// Password reset rate limiter
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 password reset requests per 15 minutes
  message: {
    error: 'Too many password reset attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    auditLog('PASSWORD_RESET_RATE_LIMIT_EXCEEDED', null, req.ip, req.get('User-Agent'), {
      endpoint: req.path,
      method: req.method,
      email: req.body.email
    });
    res.status(429).json({
      error: 'Too many password reset attempts, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  registrationLimiter,
  paymentLimiter,
  passwordResetLimiter
};
