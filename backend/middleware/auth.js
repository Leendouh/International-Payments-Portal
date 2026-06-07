const jwt = require('jsonwebtoken');
const { auditLog } = require('../utils/logger');
const { emitSessionExpired, emitSecurityAlert } = require('../utils/websocket');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/**
 * Authentication Middleware
 * Implements JWT and session-based authentication as per Task 1 requirements
 */

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    auditLog('AUTH_TOKEN_MISSING', null, req.ip, req.get('User-Agent'), {
      endpoint: req.path,
      method: req.method
    });
    return res.status(401).json({
      error: 'Access token required',
      code: 'TOKEN_MISSING'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      auditLog('AUTH_TOKEN_INVALID', null, req.ip, req.get('User-Agent'), {
        endpoint: req.path,
        method: req.method,
        error: err.message
      });
      return res.status(403).json({
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }

    req.user = user;
    next();
  });
};

// Middleware to verify session from database
const authenticateSession = async (req, res, next) => {
  const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];

  // Log only metadata, not sensitive session data
  console.log('Session authentication attempted', {
    path: req.path,
    method: req.method,
    hasCookieSession: !!req.cookies?.sessionId,
    hasHeaderSession: !!req.headers['x-session-id']
  });

  if (!sessionId) {
    auditLog('SESSION_MISSING', null, req.ip, req.get('User-Agent'), {
      endpoint: req.path,
      method: req.method
    });
    return res.status(401).json({
      error: 'Session required',
      code: 'SESSION_MISSING'
    });
  }

  try {
    const db = require('../utils/database');
    const query = `
      SELECT s.*, c.id as customer_id, c.email, c.full_name
      FROM user_sessions s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.session_id = $1 AND s.expires_at > CURRENT_TIMESTAMP
    `;
    
    const result = await db.query(query, [sessionId]);
    
    if (result.rows.length === 0) {
      auditLog('SESSION_EXPIRED', null, req.ip, req.get('User-Agent'), {
        endpoint: req.path,
        method: req.method,
        sessionId: sessionId.substring(0, 10) + '...'
      });
      
      // Clear the invalid session cookie
      res.clearCookie('sessionId', {
        httpOnly: true,
        secure: false, // Match login cookie settings
        sameSite: 'lax' // Match login cookie settings
      });
      
      // Emit real-time session expiration
      if (session && session.customer_id) {
        emitSessionExpired(session.customer_id);
      }
      
      return res.status(401).json({
        error: 'Session expired or invalid',
        code: 'SESSION_EXPIRED'
      });
    }

    const session = result.rows[0];
    
    // Optional: IP binding check (basic session jacking protection)
    if (session.ip_address !== req.ip) {
      auditLog('SESSION_IP_MISMATCH', session.customer_id, req.ip, req.get('User-Agent'), {
        originalIp: session.ip_address,
        currentIp: req.ip,
        endpoint: req.path
      });
      
      // In production, you might want to invalidate the session
      // For demo purposes, we'll just log it
    }

    req.user = {
      id: session.customer_id,
      email: session.email,
      fullName: session.full_name
    };
    
    req.session = {
      id: sessionId,
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      expiresAt: session.expires_at
    };

    next();
  } catch (error) {
    console.error('Session authentication error:', error);
    auditLog('SESSION_AUTH_ERROR', null, req.ip, req.get('User-Agent'), {
      endpoint: req.path,
      error: error.message
    });
    
    return res.status(500).json({
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Combined authentication (either JWT or session)
const authenticate = (req, res, next) => {
  // Try JWT first
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
    return authenticateToken(req, res, next);
  }
  
  // Fall back to session
  return authenticateSession(req, res, next);
};

// Middleware to ensure user is authenticated
const requireAuth = async (req, res, next) => {
  // First authenticate the user
  await authenticate(req, res, (err) => {
    if (err) return next(err);
    
    // Then check if user is properly authenticated
    if (!req.user) {
      auditLog('ACCESS_DENIED_UNAUTHORIZED', null, req.ip, req.get('User-Agent'), {
        endpoint: req.path,
        method: req.method
      });
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    next();
  });
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      fullName: user.fullName 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Generate secure session ID
const generateSessionId = () => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex'); // 256-bit random token
};

module.exports = {
  authenticate,
  authenticateToken,
  authenticateSession,
  requireAuth,
  generateToken,
  generateSessionId
};
