const csrf = require('csrf');
const { auditLog } = require('../utils/logger');

const tokens = new csrf();

/**
 * CSRF Protection Middleware
 * Implements CSRF tokens as per Task 1 requirements
 */

// Middleware to provide CSRF token to clients
const csrfToken = (req, res, next) => {
  const token = tokens.create(req.session?.sessionId || 'anonymous');
  res.set('X-CSRF-Token', token);
  req.csrfToken = () => token;
  next();
};

// Middleware to validate CSRF token on state-changing requests
const csrfProtection = (req, res, next) => {
  // Skip CSRF validation for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  
  if (!token) {
    auditLog('CSRF_TOKEN_MISSING', req.user?.id, req.ip, req.get('User-Agent'), {
      endpoint: req.path,
      method: req.method
    });
    return res.status(403).json({
      error: 'CSRF token missing',
      code: 'CSRF_MISSING'
    });
  }

  const secret = req.session?.sessionId || 'anonymous';
  
  if (!tokens.verify(secret, token)) {
    auditLog('CSRF_TOKEN_INVALID', req.user?.id, req.ip, req.get('User-Agent'), {
      endpoint: req.path,
      method: req.method,
      token: token.substring(0, 10) + '...' // Log partial token for debugging
    });
    return res.status(403).json({
      error: 'Invalid CSRF token',
      code: 'CSRF_INVALID'
    });
  }

  next();
};

// Double Submit Cookie Pattern (alternative approach)
const csrfDoubleSubmit = (req, res, next) => {
  // Skip CSRF validation for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.csrf_token;
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken) {
    auditLog('CSRF_DOUBLE_SUBMIT_MISSING', req.user?.id, req.ip, req.get('User-Agent'), {
      endpoint: req.path,
      method: req.method,
      hasCookie: !!cookieToken,
      hasHeader: !!headerToken
    });
    return res.status(403).json({
      error: 'CSRF tokens missing',
      code: 'CSRF_DOUBLE_SUBMIT_MISSING'
    });
  }

  if (cookieToken !== headerToken) {
    auditLog('CSRF_DOUBLE_SUBMIT_MISMATCH', req.user?.id, req.ip, req.get('User-Agent'), {
      endpoint: req.path,
      method: req.method
    });
    return res.status(403).json({
      error: 'CSRF tokens do not match',
      code: 'CSRF_DOUBLE_SUBMIT_MISMATCH'
    });
  }

  next();
};

module.exports = {
  csrfToken,
  csrfProtection,
  csrfDoubleSubmit
};
