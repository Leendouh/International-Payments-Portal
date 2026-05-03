const express = require('express');
const { body } = require('express-validator');
const { 
  registrationValidation, 
  loginValidation, 
  handleValidationErrors 
} = require('../middleware/inputValidation');
const { 
  authLimiter, 
  registrationLimiter 
} = require('../middleware/rateLimiter');
const { 
  csrfProtection, 
  csrfToken 
} = require('../middleware/csrf');
const { 
  generateToken, 
  generateSessionId,
  authenticateSession,
  requireAuth 
} = require('../middleware/auth');
const { 
  hashPassword, 
  verifyPassword,
  hashIdNumber,
  hashAccountNumber 
} = require('../utils/hash');
const { auditLog } = require('../utils/logger');
const router = express.Router();

/**
 * Authentication Routes
 * Implements secure registration, login, and logout endpoints
 */

// POST /api/register - Customer registration
router.post('/register', 
  registrationLimiter,
  csrfProtection,
  registrationValidation,
  handleValidationErrors,
  async (req, res) => {
    const { fullName, idNumber, accountNumber, email, password } = req.body;

    try {
      const db = require('../utils/database');
      
      // Check if user already exists
      const existingUser = await db.query(
        'SELECT id FROM customers WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        await auditLog('REGISTRATION_FAILED_EMAIL_EXISTS', null, req.ip, req.get('User-Agent'), {
          email,
          reason: 'Email already registered'
        });
        return res.status(409).json({
          error: 'An account with this email already exists. Please try logging in or use a different email address.',
          code: 'EMAIL_EXISTS'
        });
      }

      // Hash the password
      const passwordHash = await hashPassword(password);
      
      // Hash sensitive data (ID number and account number)
      const idHashData = hashIdNumber(idNumber);
      const accountHashData = hashAccountNumber(accountNumber);

      // Insert new customer
      const result = await db.query(
        `INSERT INTO customers 
         (full_name, id_hash, id_salt, account_number_hash, account_number_salt, email, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, full_name, email, created_at`,
        [
          fullName,
          idHashData.hash,
          idHashData.salt,
          accountHashData.hash,
          accountHashData.salt,
          email,
          passwordHash
        ]
      );

      const newCustomer = result.rows[0];

      await auditLog('CUSTOMER_REGISTERED', newCustomer.id, req.ip, req.get('User-Agent'), {
        email,
        fullName
      });

      // Generate JWT token
      const token = generateToken({
        id: newCustomer.id,
        email: newCustomer.email,
        fullName: newCustomer.full_name
      });

      // Create session
      const sessionId = generateSessionId();
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

      await db.query(
        `INSERT INTO user_sessions 
         (session_id, customer_id, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [sessionId, newCustomer.id, req.ip, req.get('User-Agent'), expiresAt]
      );

      // Set secure session cookie
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
        path: '/'
      });

      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: newCustomer.id,
          fullName: newCustomer.full_name,
          email: newCustomer.email
        },
        token,
        sessionId
      });

    } catch (error) {
      console.error('Registration error:', error);
      await auditLog('REGISTRATION_ERROR', null, req.ip, req.get('User-Agent'), {
        email,
        error: error.message
      });
      
      res.status(500).json({
        error: 'Registration failed',
        code: 'REGISTRATION_ERROR'
      });
    }
  }
);

// POST /api/login - Customer login
router.post('/login',
  authLimiter,
  csrfProtection,
  loginValidation,
  handleValidationErrors,
  async (req, res) => {
    const { email, accountNumber, password } = req.body;

    try {
      const db = require('../utils/database');
      
      // Find customer by email
      const result = await db.query(
        'SELECT id, full_name, email, password_hash, account_number_hash, account_number_salt FROM customers WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        await auditLog('LOGIN_FAILED_EMAIL_NOT_FOUND', null, req.ip, req.get('User-Agent'), {
          email
        });
        // Generic error message for security - don't reveal email exists
        return res.status(401).json({
          error: 'Invalid email, password, or account number. Please check your credentials and try again.',
          code: 'INVALID_CREDENTIALS'
        });
      }

      const customer = result.rows[0];

      // Verify password
      const { verifyPassword } = require('../utils/hash');
      const passwordValid = await verifyPassword(password, customer.password_hash);

      if (!passwordValid) {
        await auditLog('LOGIN_FAILED_INVALID_PASSWORD', customer.id, req.ip, req.get('User-Agent'), {
          email
        });
        // Generic error message for security - don't reveal password is wrong
        return res.status(401).json({
          error: 'Invalid email, password, or account number. Please check your credentials and try again.',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Verify account number
      const { verifyHashedData } = require('../utils/hash');
      const accountNumberValid = verifyHashedData(
        accountNumber,
        customer.account_number_salt,
        customer.account_number_hash
      );

      if (!accountNumberValid) {
        await auditLog('LOGIN_FAILED_INVALID_ACCOUNT', customer.id, req.ip, req.get('User-Agent'), {
          email,
          reason: 'Invalid account number'
        });
        // Generic error message for security - don't reveal account number is wrong
        return res.status(401).json({
          error: 'Invalid email, password, or account number. Please check your credentials and try again.',
          code: 'INVALID_CREDENTIALS'
        });
      }

      await auditLog('CUSTOMER_LOGIN_SUCCESS', customer.id, req.ip, req.get('User-Agent'), {
        email
      });

      // Generate JWT token
      const token = generateToken({
        id: customer.id,
        email: customer.email,
        fullName: customer.full_name
      });

      // Create new session (session fixation prevention)
      const sessionId = generateSessionId();
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

      await db.query(
        `INSERT INTO user_sessions 
         (session_id, customer_id, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [sessionId, customer.id, req.ip, req.get('User-Agent'), expiresAt]
      );

      // Set secure session cookie
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
        path: '/'
      });

      res.json({
        message: 'Login successful',
        user: {
          id: customer.id,
          fullName: customer.full_name,
          email: customer.email
        },
        token,
        sessionId
      });

    } catch (error) {
      console.error('Login error:', error);
      await auditLog('LOGIN_ERROR', null, req.ip, req.get('User-Agent'), {
        email,
        error: error.message
      });
      
      res.status(500).json({
        error: 'Login failed',
        code: 'LOGIN_ERROR'
      });
    }
  }
);

// POST /api/logout - Customer logout
router.post('/logout',
  requireAuth,
  csrfProtection,
  async (req, res) => {
    try {
      const db = require('../utils/database');
      
      // Invalidate session in database
      if (req.session?.id) {
        await db.query(
          'DELETE FROM user_sessions WHERE session_id = $1',
          [req.session.id]
        );
      }

      await auditLog('CUSTOMER_LOGOUT', req.user.id, req.ip, req.get('User-Agent'), {
        sessionId: req.session?.id
      });

      // Clear session cookie
      res.clearCookie('sessionId', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });

      res.json({
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error);
      await auditLog('LOGOUT_ERROR', req.user?.id, req.ip, req.get('User-Agent'), {
        error: error.message
      });
      
      res.status(500).json({
        error: 'Logout failed',
        code: 'LOGOUT_ERROR'
      });
    }
  }
);

// GET /api/csrf-token - Get CSRF token
router.get('/csrf-token', csrfToken, (req, res) => {
  res.json({
    csrfToken: req.csrfToken()
  });
});

// GET /api/profile - Get user profile (protected)
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const db = require('../utils/database');
    
    const result = await db.query(
      'SELECT id, full_name, email, created_at FROM customers WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      user: {
        id: result.rows[0].id,
        fullName: result.rows[0].full_name,
        email: result.rows[0].email,
        createdAt: result.rows[0].created_at
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      code: 'PROFILE_ERROR'
    });
  }
});

module.exports = router;
