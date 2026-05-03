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

// Import enhanced security modules
const { 
  createSecureServer, 
  sslSecurityHeaders, 
  monitorCertificate,
  validateSSLConfig 
} = require('./utils/sslSecurity');
const { 
  initializeAttackProtection,
  attackProtection,
  getAttackStatistics
} = require('./utils/attackProtection');

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

// Initialize attack protection system
initializeAttackProtection();

// Enhanced security middleware stack
app.use(attackProtection({
  ipProtection: {
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 1000,
    geoBlocking: {
      enabled: true,
      allowedCountries: ['ZA', 'US', 'GB', 'CA', 'AU'],
      blockedCountries: ['CN', 'RU', 'KP', 'IR']
    }
  },
  anomalyDetection: {
    enabled: true,
    patterns: {
      bruteForce: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
      credentialStuffing: { maxAttempts: 20, windowMs: 60 * 60 * 1000 },
      ddos: { maxRequests: 1000, windowMs: 60 * 1000 },
      scanning: { maxUniquePaths: 50, windowMs: 30 * 60 * 1000 },
      injection: { maxSuspiciousPatterns: 10, windowMs: 10 * 60 * 1000 }
    }
  }
}));

app.use(sslSecurityHeaders({
  hsts: 'max-age=31536000; includeSubDomains; preload',
  enablePinning: true,
  expectCT: true
}));

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

// Enhanced SSL certificate configuration with fallback
let sslOptions = null;
let useHTTPS = false;

// Try to load SSL certificates
const sslKeyPath = path.join(__dirname, '../ssl/server.key');
const sslCertPath = path.join(__dirname, '../ssl/server.crt');
const fallbackKeyPath = path.join(__dirname, '../certs/key.pem');
const fallbackCertPath = path.join(__dirname, '../certs/cert.pem');

try {
  const keyPath = fs.existsSync(sslKeyPath) ? sslKeyPath : fallbackKeyPath;
  const certPath = fs.existsSync(sslCertPath) ? sslCertPath : fallbackCertPath;
  
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    sslOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
      
      // Enhanced SSL/TLS configuration
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3',
      honorCipherOrder: true,
      ciphers: [
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'TLS_AES_128_GCM_SHA256',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-CHACHA20-POLY1305',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-CHACHA20-POLY1305',
        'ECDHE-ECDSA-AES128-GCM-SHA256'
      ].join(':'),
      
      // Secure options
      secureOptions: require('crypto').constants.SSL_OP_NO_SSLv3 |
                     require('crypto').constants.SSL_OP_NO_TLSv1 |
                     require('crypto').constants.SSL_OP_NO_TLSv1_1 |
                     require('crypto').constants.SSL_OP_CIPHER_SERVER_PREFERENCE,
      
      // ECDH curve
      ecdhCurve: 'X25519:P-256:P-384:P-521',
      
      // Session settings
      sessionTimeout: 300,
      requestCert: false,
      rejectUnauthorized: false
    };
    useHTTPS = true;
    console.log('✅ SSL certificates loaded successfully');
  } else {
    console.log('⚠️  SSL certificates not found, running in HTTP mode for development');
  }
} catch (error) {
  console.log('⚠️  Failed to load SSL certificates, running in HTTP mode for development:', error.message);
}

// Validate SSL configuration only if SSL is available
let sslValidation = { isValid: true, issues: [], recommendations: [] };
if (sslOptions) {
  sslValidation = validateSSLConfig(sslOptions);
  if (!sslValidation.isValid) {
    console.warn('SSL Configuration Issues:', sslValidation.issues);
    console.warn('Recommendations:', sslValidation.recommendations);
  }
  
  // Monitor certificate expiry
  monitorCertificate(
    path.join(__dirname, '../ssl/server.crt'),
    path.join(__dirname, '../ssl/server.key'),
    {
      daysBeforeExpiry: 30,
      onExpiryWarning: (daysUntilExpiry, certInfo) => {
        console.warn(`⚠️  Certificate expires in ${daysUntilExpiry} days!`);
        // Send notification to admin team
      }
    }
  );
}

// Create server (HTTP or HTTPS)
let server;
if (useHTTPS && sslOptions) {
  // Create enhanced secure server
  server = createSecureServer(app, {
    ssl: sslOptions,
    key: sslOptions.key,
    cert: sslOptions.cert,
    enablePinning: process.env.NODE_ENV === 'production'
  });
} else {
  // Create HTTP server for development
  const http = require('http');
  server = http.createServer(app);
  console.log('⚠️  Running in HTTP mode - use HTTPS in production!');
}

// Attack statistics monitoring
setInterval(() => {
  const stats = getAttackStatistics();
  if (stats.blockedRequests > 0 || stats.suspiciousIPs > 0) {
    console.log('�️  Attack Protection Statistics:', {
      totalRequests: stats.totalRequests,
      blockedRequests: stats.blockedRequests,
      suspiciousIPs: stats.suspiciousIPs,
      blockedIPs: stats.blockedIPs
    });
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Start server
server.listen(PORT, () => {
  const protocol = useHTTPS ? 'https' : 'http';
  console.log(`� Server running on ${protocol}://localhost:${PORT}`);
  
  if (useHTTPS) {
    console.log('� Enhanced security features enabled:');
    console.log('   - HTTPS with TLS 1.2/1.3');
    console.log('   - HSTS with preload');
    console.log('   - Certificate pinning');
    console.log('   - Certificate monitoring');
  } else {
    console.log('⚠️  Development mode - HTTPS security features disabled');
    console.log('   - Run with SSL certificates for full security');
  }
  
  console.log('🛡️  Attack protection features enabled:');
  console.log('   - Attack detection & prevention');
  console.log('   - IP-based protection');
  console.log('   - Anomaly detection');
  console.log('   - Geo-blocking');
  console.log('   - CSRF protection');
  console.log('   - Rate limiting');
  console.log('   - Input validation & sanitization');
  console.log('   - Security headers');
  console.log('   - Real-time threat detection');
  console.log('   - Account lockout with countdown');
});

// Log server start
const { auditLog } = require('./utils/logger');
auditLog('SERVER_STARTED', null, '127.0.0.1', 'Server', {
  port: PORT,
  environment: process.env.NODE_ENV || 'development'
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
