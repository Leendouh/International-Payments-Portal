// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Import middleware
const securityHeaders = require('./middleware/securityHeaders');
const { generalLimiter } = require('./middleware/rateLimiter');
const { requestLogger } = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');

// Import database
const { initializeDatabase } = require('./utils/database');

/**
 * Main Server Application
 * Implements secure HTTPS server with all security controls
 */

const app = express();
const PORT = process.env.PORT || 8443;

// Initialize database
initializeDatabase();

// Security middleware
app.use(securityHeaders);
app.use(generalLimiter);
app.use(requestLogger);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'https://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Trust proxy for getting real IP addresses
app.set('trust proxy', 1);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'International Payments Portal API',
    version: '1.0.0',
    endpoints: {
      authentication: {
        'POST /api/auth/register': 'Register new customer',
        'POST /api/auth/login': 'Customer login',
        'POST /api/auth/logout': 'Customer logout',
        'GET /api/auth/profile': 'Get user profile',
        'GET /api/auth/csrf-token': 'Get CSRF token'
      },
      payments: {
        'POST /api/payments': 'Create new payment',
        'GET /api/payments': 'Get payment history',
        'GET /api/payments/:id': 'Get payment details',
        'GET /api/payments/currencies/list': 'Get supported currencies',
        'GET /api/payments/providers/list': 'Get supported providers'
      }
    },
    security: {
      'All endpoints require HTTPS': true,
      'CSRF protection': 'Enabled for state-changing requests',
      'Rate limiting': 'Enabled',
      'Input validation': 'Whitelist-based validation',
      'Session security': 'HttpOnly, Secure, SameSite cookies'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Log the error
  const { errorLog } = require('./utils/logger');
  errorLog(error, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(error.status || 500).json({
    error: isDevelopment ? error.message : 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(isDevelopment && { stack: error.stack })
  });
});

// SSL certificate configuration
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, '../certs/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem')),
  minVersion: 'TLSv1.2',
  ciphers: [
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-ECDSA-CHACHA20-POLY1305',
    'ECDHE-RSA-CHACHA20-POLY1305',
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256'
  ].join(':'),
  honorCipherOrder: true
};

// Create HTTPS server
const server = https.createServer(sslOptions, app);

// Start server
server.listen(PORT, () => {
  console.log(`🔒 Secure International Payments Portal API running on https://localhost:${PORT}`);
  console.log(`📚 API documentation available at https://localhost:${PORT}/api`);
  console.log(`🏥 Health check at https://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log server start
  const { auditLog } = require('./utils/logger');
  auditLog('SERVER_STARTED', null, '127.0.0.1', 'Server', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});

module.exports = app;
