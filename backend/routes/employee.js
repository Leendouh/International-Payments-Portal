const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { verifyPassword } = require('../utils/hash');
const db = require('../utils/database');
const { generalLimiter } = require('../middleware/rateLimiter');
const { csrfProtection } = require('../middleware/csrf');
const { body, validationResult } = require('express-validator');
const { validateInput } = require('../utils/inputWhitelist');

/**
 * Employee Routes
 * Handles employee authentication and transaction management
 */

// Employee login validation
const employeeLoginValidation = [
  body('username').notEmpty().withMessage('Username is required').custom((value) => {
    const validation = validateInput(value, 'fullName'); // Use fullName pattern for username
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    return true;
  }),
  body('password').notEmpty().withMessage('Password is required').custom((value) => {
    const validation = validateInput(value, 'password');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    return true;
  })
];

// POST /api/employee/login - Employee login
router.post('/login',
  generalLimiter,
  csrfProtection,
  employeeLoginValidation,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  async (req, res) => {
    const { username, password } = req.body;

    try {
      // Find employee by username
      const result = await db.query(
        'SELECT id, username, full_name, email, password_hash, role FROM employees WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const employee = result.rows[0];

      // Verify password
      const isValidPassword = await verifyPassword(password, employee.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login
      await db.query(
        'UPDATE employees SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [employee.id]
      );

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: employee.id, 
          username: employee.username, 
          role: employee.role,
          type: 'employee'
        },
        process.env.JWT_SECRET || 'your-jwt-secret-change-in-production',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        employee: {
          id: employee.id,
          username: employee.username,
          fullName: employee.full_name,
          email: employee.email,
          role: employee.role
        }
      });
    } catch (error) {
      console.error('Employee login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/employee/pending-transactions - Get all pending transactions
router.get('/pending-transactions',
  async (req, res) => {
    try {
      // Verify employee token from header
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-change-in-production');
      if (decoded.type !== 'employee') {
        return res.status(403).json({ error: 'Access denied. Employees only.' });
      }

      // Get all pending and approved transactions with customer information
      const result = await db.query(`
        SELECT 
          t.id,
          t.customer_id,
          c.full_name as customer_name,
          c.email as customer_email,
          t.amount,
          t.currency,
          t.recipient_account as beneficiary_account,
          t.swift_bic,
          t.status,
          t.created_at
        FROM transactions t
        JOIN customers c ON t.customer_id = c.id
        WHERE t.status IN ('pending', 'approved')
        ORDER BY t.created_at DESC
      `);

      res.json({
        transactions: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      console.error('Get pending transactions error:', error);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/employee/verify/:id - Verify a transaction
router.post('/verify/:id',
  async (req, res) => {
    try {
      // Verify employee token from header
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-change-in-production');
      if (decoded.type !== 'employee') {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check role-based permissions
      if (decoded.role !== 'admin' && decoded.role !== 'manager') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const transactionId = req.params.id;

      // Update transaction status to approved
      const result = await db.query(
        'UPDATE transactions SET status = $1 WHERE id = $2 AND status = $3 RETURNING *',
        ['approved', transactionId, 'pending']
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json({
        message: 'Transaction approved successfully',
        transaction: result.rows[0]
      });
    } catch (error) {
      console.error('Verify transaction error:', error);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/employee/submit/:id - Submit transaction to SWIFT
router.post('/submit/:id',
  async (req, res) => {
    try {
      // Verify employee token from header
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-change-in-production');
      if (decoded.type !== 'employee') {
        return res.status(403).json({ error: 'Access denied. Employees only.' });
      }

      // Check role-based permissions - only admin can process
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const transactionId = req.params.id;

      // Update transaction status to processed
      const result = await db.query(
        'UPDATE transactions SET status = $1 WHERE id = $2 AND status = $3 RETURNING *',
        ['processed', transactionId, 'approved']
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json({
        message: 'Transaction submitted to SWIFT successfully',
        transaction: result.rows[0]
      });
    } catch (error) {
      console.error('Submit transaction error:', error);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/employee/reject/:id - Reject transaction
router.post('/reject/:id',
  async (req, res) => {
    try {
      // Verify employee token from header
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-change-in-production');
      if (decoded.type !== 'employee') {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check role-based permissions - only admin can reject
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const transactionId = req.params.id;

      // Update transaction status to rejected
      const result = await db.query(
        'UPDATE transactions SET status = $1 WHERE id = $2 AND status = $3 RETURNING *',
        ['rejected', transactionId, 'pending']
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json({
        message: 'Transaction rejected successfully',
        transaction: result.rows[0]
      });
    } catch (error) {
      console.error('Reject transaction error:', error);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Employee creation validation
const employeeCreationValidation = [
  body('username').notEmpty().withMessage('Username is required').custom((value) => {
    const validation = validateInput(value, 'fullName'); // Use fullName pattern for username
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    return true;
  }),
  body('fullName').notEmpty().withMessage('Full name is required').custom((value) => {
    const validation = validateInput(value, 'fullName');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    return true;
  }),
  body('email').notEmpty().withMessage('Email is required').custom((value) => {
    const validation = validateInput(value, 'email');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    return true;
  }),
  body('password').notEmpty().withMessage('Password is required').custom((value) => {
    const validation = validateInput(value, 'password');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    return true;
  }),
  body('role').notEmpty().withMessage('Role is required').custom((value) => {
    if (!['employee', 'manager', 'admin'].includes(value)) {
      throw new Error('Invalid role');
    }
    return true;
  })
];

// POST /api/employee/create - Create new employee (admin only)
router.post('/create',
  employeeCreationValidation,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  async (req, res) => {
    try {
      // Verify employee token from header
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-change-in-production');
      if (decoded.type !== 'employee') {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check role-based permissions - only admin can create employees
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { username, fullName, email, password, role } = req.body;

      // Validate input
      if (!username || !fullName || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Validate role
      if (!['employee', 'manager', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      // Check if username or email already exists
      const existingEmployee = await db.query(
        'SELECT id FROM employees WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (existingEmployee.rows.length > 0) {
        return res.status(400).json({ error: 'Username or email already in use' });
      }

      // Hash the password
      const { hashPassword } = require('../utils/hash');
      const passwordHash = await hashPassword(password);

      // Insert new employee
      const result = await db.query(
        `INSERT INTO employees (username, full_name, email, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, username, full_name, email, role, created_at`,
        [username, fullName, email, passwordHash, role]
      );

      res.status(201).json({
        message: 'Employee created successfully',
        employee: result.rows[0]
      });
    } catch (error) {
      console.error('Create employee error:', error);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/employee/profile - Get current employee profile
router.get('/profile',
  async (req, res) => {
    try {
      // Verify employee token from header
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-change-in-production');
      if (decoded.type !== 'employee') {
        return res.status(403).json({ error: 'Access denied. Employees only.' });
      }

      // Get employee details
      const result = await db.query(
        'SELECT id, username, full_name, email, role, created_at, last_login FROM employees WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      res.json({
        employee: result.rows[0]
      });
    } catch (error) {
      console.error('Get profile error:', error);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/employee/stats - Get employee statistics (admin only)
router.get('/stats',
  async (req, res) => {
    try {
      // Verify employee token from header
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-change-in-production');
      if (decoded.type !== 'employee') {
        return res.status(403).json({ error: 'Access denied. Employees only.' });
      }

      // Check role-based permissions - only admin can view stats
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get employee counts by role
      const result = await db.query(
        'SELECT role, COUNT(*) as count FROM employees GROUP BY role'
      );

      const stats = {
        admin: 0,
        manager: 0,
        employee: 0,
        total: 0
      };

      result.rows.forEach(row => {
        stats[row.role] = parseInt(row.count);
        stats.total += parseInt(row.count);
      });

      res.json({
        stats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/employee/all - Get all employees (admin only)
router.get('/all',
  async (req, res) => {
    try {
      // Verify employee token from header
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-change-in-production');
      if (decoded.type !== 'employee') {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check role-based permissions - only admin can view all employees
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get all employees
      const result = await db.query(
        'SELECT id, username, full_name, email, role, created_at, last_login FROM employees ORDER BY created_at DESC'
      );

      res.json({
        employees: result.rows
      });
    } catch (error) {
      console.error('Get all employees error:', error);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/employee/reset-password/:id - Reset employee password (admin only)
router.post('/reset-password/:id',
  async (req, res) => {
    try {
      // Verify employee token from header
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-change-in-production');
      if (decoded.type !== 'employee') {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check role-based permissions - only admin can reset passwords
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const employeeId = req.params.id;
      const { newPassword } = req.body;

      // Validate input
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }

      // Check if employee exists
      const existingEmployee = await db.query(
        'SELECT id FROM employees WHERE id = $1',
        [employeeId]
      );

      if (existingEmployee.rows.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      // Hash the new password
      const { hashPassword } = require('../utils/hash');
      const passwordHash = await hashPassword(newPassword);

      // Update password
      await db.query(
        'UPDATE employees SET password_hash = $1 WHERE id = $2',
        [passwordHash, employeeId]
      );

      res.json({
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;
