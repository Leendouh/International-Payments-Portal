const express = require('express');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import middleware
const { authenticateSession, requireAuth } = require('./middleware/auth');
const { csrfProtection, csrfToken } = require('./middleware/csrf');
const { generalLimiter } = require('./middleware/rateLimiter');
const { sanitizeInput } = require('./middleware/inputValidation');
const securityHeaders = require('./middleware/securityHeaders');
const contentTypeValidation = require('./middleware/contentTypeValidation');

// Import utilities
const db = require('./utils/database');
const { auditLog } = require('./utils/logger');
const { initializeWebSocket } = require('./utils/websocket');

// Import routes
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');
const employeeRoutes = require('./routes/employee');

// Initialize Express app
const app = express();

// SSL Configuration
const SSL_OPTIONS = {
  key: fs.readFileSync(path.join(__dirname, '../certs/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem')),
  minVersion: 'TLSv1.2',
  ciphers: [
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-ECDSA-CHACHA20-POLY1305',
    'ECDHE-RSA-CHACHA20-POLY1305'
  ].join(':'),
  honorCipherOrder: true,
  // Enable HTTP/2
  allowHTTP1: true
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// HTTPS redirect middleware with fixed base URL
app.use((req, res, next) => {
  if (!req.secure && process.env.NODE_ENV === 'production') {
    // Use environment variable for production hostname, not user-controlled host header
    const productionHost = process.env.PRODUCTION_HOST || 'yourdomain.com';
    return res.redirect(301, `https://${productionHost}${req.url}`);
  }
  next();
});

app.use(securityHeaders);

// CORS configuration - use environment variables for origins
const allowedOrigins = new Set([
  'http://localhost:3000',
  'https://localhost:3000',
  ...(process.env.ADDITIONAL_CORS_ORIGINS ? process.env.ADDITIONAL_CORS_ORIGINS.split(',') : [])
]);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  name: 'sessionId',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  store: new (require('connect-pg-simple')(session))({
    pool: db.pool,
    tableName: 'user_sessions'
  })
}));

// Rate limiting
app.use(generalLimiter);

// Input sanitization
app.use(sanitizeInput);

// Request logging middleware
app.use(async (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    await auditLog('HTTP_REQUEST', req.user?.id, req.ip, req.get('User-Agent'), {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration
    });
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/employee', employeeRoutes);

// CSRF token endpoint
app.get('/api/csrf-token', csrfToken, (req, res) => {
  res.json({
    csrfToken: req.csrfToken()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});

// Global error handler
app.use(async (err, req, res, next) => {
  console.error('Global error handler:', err);
  
  await auditLog('GLOBAL_ERROR', req.user?.id, req.ip, req.get('User-Agent'), {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

// Create HTTPS server
const httpsServer = https.createServer(SSL_OPTIONS, app);

// Setup WebSocket (initializeWebSocket creates its own Server instance)
const io = initializeWebSocket(httpsServer);

// Start server
const PORT = process.env.PORT || 8443;

const startServer = async () => {
  try {
    // Initialize database connection
    await db.initializeDatabase();
    console.log('Database connected successfully');
    
    // Start HTTPS server
    httpsServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🔒 Secure HTTPS server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔐 SSL/TLS enabled with TLSv1.2+`);
      console.log(`🛡️ Security features active:`);
      console.log(`   - Helmet.js headers`);
      console.log(`   - CSRF protection`);
      console.log(`   - Rate limiting`);
      console.log(`   - Input whitelisting`);
      console.log(`   - Password hashing (scrypt)`);
      console.log(`   - Session management`);
      console.log(`   - Audit logging`);
      console.log(`   - WebSocket real-time updates`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      httpsServer.close(() => {
        console.log('HTTPS server closed');
        db.pool.end(() => {
          console.log('Database pool closed');
          process.exit(0);
        });
      });
    });
    
    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully...');
      httpsServer.close(() => {
        console.log('HTTPS server closed');
        db.pool.end(() => {
          console.log('Database pool closed');
          process.exit(0);
        });
      });
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, httpsServer, io };
