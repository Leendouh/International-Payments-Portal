const express = require('express');
const { 
  paymentValidation, 
  handleValidationErrors 
} = require('../middleware/inputValidation');
const { 
  paymentLimiter 
} = require('../middleware/rateLimiter');
const { 
  csrfProtection 
} = require('../middleware/csrf');
const { 
  requireAuth 
} = require('../middleware/auth');
const { 
  generateHmacSignature 
} = require('../utils/hash');
const { auditLog } = require('../utils/logger');
const router = express.Router();

/**
 * Payment Routes
 * Implements secure payment initiation with HMAC signing
 */

// POST /api/payments - Create a new payment
router.post('/',
  requireAuth,
  paymentLimiter,
  csrfProtection,
  paymentValidation,
  handleValidationErrors,
  async (req, res) => {
    const { amount, currency, provider, swiftBic, recipientAccount } = req.body;
    
    try {
      const db = require('../utils/database');
      
      // Generate HMAC signature for transaction integrity
      const transactionData = {
        customerId: req.user.id,
        amount,
        currency,
        provider,
        swiftBic,
        recipientAccount,
        timestamp: new Date().toISOString()
      };
      
      const hmacSecret = process.env.HMAC_SECRET || 'your-hmac-secret-change-in-production';
      const signature = generateHmacSignature(transactionData, hmacSecret);

      // Insert transaction
      const result = await db.query(
        `INSERT INTO transactions 
         (customer_id, amount, currency, provider, swift_bic, recipient_account, submission_signature)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, amount, currency, provider, swift_bic, recipient_account, status, created_at`,
        [req.user.id, amount, currency, provider, swiftBic, recipientAccount, signature]
      );

      const transaction = result.rows[0];

      await auditLog('PAYMENT_INITIATED', req.user.id, req.ip, req.get('User-Agent'), {
        transactionId: transaction.id,
        amount,
        currency,
        provider,
        swiftBic,
        recipientAccount: recipientAccount.substring(0, 4) + '...' // Log partial account number
      });

      res.status(201).json({
        message: 'Payment initiated successfully',
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency,
          provider: transaction.provider,
          swiftBic: transaction.swift_bic,
          recipientAccount: transaction.recipient_account,
          status: transaction.status,
          createdAt: transaction.created_at
        }
      });

    } catch (error) {
      console.error('Payment creation error:', error);
      await auditLog('PAYMENT_ERROR', req.user.id, req.ip, req.get('User-Agent'), {
        amount,
        currency,
        error: error.message
      });
      
      res.status(500).json({
        error: 'Payment initiation failed',
        code: 'PAYMENT_ERROR'
      });
    }
  }
);

// GET /api/payments - Get user's payment history
router.get('/',
  requireAuth,
  async (req, res) => {
    try {
      const db = require('../utils/database');
      
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const result = await db.query(
        `SELECT id, amount, currency, provider, swift_bic, recipient_account, 
                status, created_at, updated_at
         FROM transactions 
         WHERE customer_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      );

      const countResult = await db.query(
        'SELECT COUNT(*) FROM transactions WHERE customer_id = $1',
        [req.user.id]
      );

      const totalCount = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        transactions: result.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit
        }
      });

    } catch (error) {
      console.error('Payment history error:', error);
      res.status(500).json({
        error: 'Failed to fetch payment history',
        code: 'PAYMENT_HISTORY_ERROR'
      });
    }
  }
);

// GET /api/payments/:id - Get specific payment details
router.get('/:id',
  requireAuth,
  async (req, res) => {
    try {
      const db = require('../utils/database');
      const transactionId = parseInt(req.params.id);

      if (isNaN(transactionId)) {
        return res.status(400).json({
          error: 'Invalid transaction ID',
          code: 'INVALID_TRANSACTION_ID'
        });
      }

      const result = await db.query(
        `SELECT id, amount, currency, provider, swift_bic, recipient_account, 
                status, created_at, updated_at, submission_signature
         FROM transactions 
         WHERE id = $1 AND customer_id = $2`,
        [transactionId, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Transaction not found',
          code: 'TRANSACTION_NOT_FOUND'
        });
      }

      const transaction = result.rows[0];

      // Verify transaction integrity using HMAC signature
      const { verifyHmacSignature } = require('../utils/hash');
      const transactionData = {
        customerId: req.user.id,
        amount: transaction.amount,
        currency: transaction.currency,
        provider: transaction.provider,
        swiftBic: transaction.swift_bic,
        recipientAccount: transaction.recipient_account,
        timestamp: transaction.created_at.toISOString()
      };

      const hmacSecret = process.env.HMAC_SECRET || 'your-hmac-secret-change-in-production';
      const signatureValid = verifyHmacSignature(
        transactionData,
        transaction.submission_signature,
        hmacSecret
      );

      if (!signatureValid) {
        await auditLog('TRANSACTION_INTEGRITY_FAILED', req.user.id, req.ip, req.get('User-Agent'), {
          transactionId,
          reason: 'HMAC signature verification failed'
        });

        return res.status(500).json({
          error: 'Transaction integrity verification failed',
          code: 'INTEGRITY_CHECK_FAILED'
        });
      }

      res.json({
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency,
          provider: transaction.provider,
          swiftBic: transaction.swift_bic,
          recipientAccount: transaction.recipient_account,
          status: transaction.status,
          createdAt: transaction.created_at,
          updatedAt: transaction.updated_at,
          integrityVerified: true
        }
      });

    } catch (error) {
      console.error('Payment details error:', error);
      res.status(500).json({
        error: 'Failed to fetch payment details',
        code: 'PAYMENT_DETAILS_ERROR'
      });
    }
  }
);

// GET /api/payments/currencies - Get supported currencies
router.get('/currencies/list', (req, res) => {
  res.json({
    currencies: [
      { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' }
    ]
  });
});

// GET /api/payments/providers - Get supported providers
router.get('/providers/list', (req, res) => {
  res.json({
    providers: [
      { code: 'SWIFT', name: 'SWIFT Network', description: 'International wire transfers' }
    ]
  });
});

module.exports = router;
