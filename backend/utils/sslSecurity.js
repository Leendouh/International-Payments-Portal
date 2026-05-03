/**
 * Enhanced SSL/TLS Security Implementation
 * Implements comprehensive SSL/TLS security for exceptional protection
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// SSL/TLS Configuration for maximum security
const SSL_CONFIG = {
  // Protocol versions - only allow secure versions
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.3',
  
  // Cipher suites - prioritize security and performance
  ciphers: [
    'TLS_AES_256_GCM_SHA384',        // TLS 1.3
    'TLS_CHACHA20_POLY1305_SHA256',  // TLS 1.3
    'TLS_AES_128_GCM_SHA256',        // TLS 1.3
    'ECDHE-RSA-AES256-GCM-SHA384',   // TLS 1.2
    'ECDHE-RSA-CHACHA20-POLY1305',   // TLS 1.2
    'ECDHE-RSA-AES128-GCM-SHA256',   // TLS 1.2
    'ECDHE-ECDSA-AES256-GCM-SHA384',  // TLS 1.2
    'ECDHE-ECDSA-CHACHA20-POLY1305',  // TLS 1.2
    'ECDHE-ECDSA-AES128-GCM-SHA256'   // TLS 1.2
  ].join(':'),
  
  // Honor cipher order
  honorCipherOrder: true,
  
  // Use secure cryptographic algorithms
  secureOptions: crypto.constants.SSL_OP_NO_SSLv3 |
                 crypto.constants.SSL_OP_NO_TLSv1 |
                 crypto.constants.SSL_OP_NO_TLSv1_1 |
                 crypto.constants.SSL_OP_CIPHER_SERVER_PREFERENCE |
                 crypto.constants.SSL_OP_SINGLE_ECDH_USE |
                 crypto.constants.SSL_OP_SINGLE_DH_USE,
  
  // ECDH curve selection
  ecdhCurve: 'X25519:P-256:P-384:P-521',
  
  // Session settings
  sessionTimeout: 300, // 5 minutes
  sessionContext: crypto.randomBytes(16).toString('hex'),
  
  // Client certificate settings (mutual TLS)
  requestCert: false, // Set to true for mTLS
  rejectUnauthorized: false, // Set to true for mTLS
  
  // OCSP Stapling
  stapling: true,
  staplingVerify: true,
  
  // Ticket encryption
  ticketKeys: crypto.randomBytes(48)
};

// HSTS (HTTP Strict Transport Security) Configuration
const HSTS_CONFIG = {
  maxAge: 31536000, // 1 year in seconds
  includeSubDomains: true,
  preload: true,
  directives: 'max-age=31536000; includeSubDomains; preload'
};

// Certificate Pinning Configuration
const CERTIFICATE_PINS = [
  // Primary certificate pin (SHA-256)
  // This should be updated with your actual certificate pins
  'pin-sha256="base64+primary==";',
  'pin-sha256="base64+backup==";',
  // Report URI for pin violations
  'report-uri="https://your-domain.com/report-uri"'
];

/**
 * Generate SSL certificate with enhanced security
 */
const generateSecureCertificate = (options = {}) => {
  const { domains = ['localhost'], keySize = 4096 } = options;
  
  // Generate private key
  const privateKey = crypto.generateKeyPairSync('rsa', {
    modulusLength: keySize,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase: options.passphrase || ''
    }
  });
  
  // Create certificate signing request
  const csr = crypto.createCertificateSigningRequest({
    key: privateKey.privateKey,
    subject: {
      countryName: options.country || 'ZA',
      stateOrProvinceName: options.state || 'Gauteng',
      localityName: options.city || 'Johannesburg',
      organizationName: options.organization || 'International Payments Portal',
      organizationalUnitName: options.unit || 'Security',
      commonName: domains[0]
    },
    extensions: [
      {
        name: 'subjectAltName',
        altNames: domains.map(domain => ({ type: 2, value: domain }))
      },
      {
        name: 'basicConstraints',
        cA: false,
        critical: true
      },
      {
        name: 'keyUsage',
        digitalSignature: true,
        keyEncipherment: true,
        critical: true
      },
      {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true
      }
    ]
  });
  
  return {
    privateKey: privateKey.privateKey,
    publicKey: privateKey.publicKey,
    csr: csr
  };
};

/**
 * Create HTTPS server with enhanced SSL configuration
 */
const createSecureServer = (app, options = {}) => {
  const https = require('https');
  
  // Check if certificates are provided or exist
  const keyPath = options.key || path.join(__dirname, '../ssl/server.key');
  const certPath = options.cert || path.join(__dirname, '../ssl/server.crt');
  
  // If no certificates available, throw an error with clear message
  if (!options.key && !fs.existsSync(keyPath)) {
    throw new Error(`SSL certificate key not found at ${keyPath}. Please provide certificates or run in HTTP mode.`);
  }
  
  if (!options.cert && !fs.existsSync(certPath)) {
    throw new Error(`SSL certificate not found at ${certPath}. Please provide certificates or run in HTTP mode.`);
  }
  
  // SSL options with enhanced security
  const sslOptions = {
    ...SSL_CONFIG,
    ...options.ssl,
    
    // Certificate and key
    key: options.key || fs.readFileSync(keyPath),
    cert: options.cert || fs.readFileSync(certPath),
    
    // Certificate chain
    ca: options.ca || (fs.existsSync(path.join(__dirname, '../ssl/ca.crt')) 
      ? fs.readFileSync(path.join(__dirname, '../ssl/ca.crt')) 
      : undefined),
    
    // DH parameters for perfect forward secrecy
    dhparam: options.dhparam || generateDHParameters(),
    
    // Session ticket keys
    ticketKeys: crypto.randomBytes(48)
  };
  
  // Create HTTPS server
  const server = https.createServer(sslOptions, app);
  
  // Set security headers (only if not already set)
  server.on('request', (req, res) => {
    // Only set headers if they haven't been sent yet
    if (!res.headersSent) {
      // HSTS header
      res.setHeader('Strict-Transport-Security', HSTS_CONFIG.directives);
      
      // Certificate pinning header
      if (options.enablePinning) {
        res.setHeader('Public-Key-Pins', CERTIFICATE_PINS.join(' '));
      }
      
      // Other security headers (only if not already set by middleware)
      if (!res.getHeader('X-Content-Type-Options')) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      }
      if (!res.getHeader('X-Frame-Options')) {
        res.setHeader('X-Frame-Options', 'DENY');
      }
      if (!res.getHeader('X-XSS-Protection')) {
        res.setHeader('X-XSS-Protection', '1; mode=block');
      }
      if (!res.getHeader('Referrer-Policy')) {
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      }
      if (!res.getHeader('Permissions-Policy')) {
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      }
    }
  });
  
  // Handle SSL errors
  server.on('tlsClientError', (err, tlsSocket) => {
    console.error('TLS Client Error:', err.message);
    // Log for security monitoring
    require('./logger').auditLog('TLS_CLIENT_ERROR', null, tlsSocket.remoteAddress, null, {
      error: err.message,
      code: err.code
    });
  });
  
  // Handle secure connection events
  server.on('secureConnection', (tlsSocket) => {
    const cipher = tlsSocket.getCipher();
    const protocol = tlsSocket.getProtocol();
    
    console.log(`Secure connection established: ${protocol} with ${cipher.name}`);
    
    // Log for monitoring
    require('./logger').auditLog('SECURE_CONNECTION_ESTABLISHED', null, tlsSocket.remoteAddress, null, {
      protocol,
      cipher: cipher.name,
      version: cipher.version
    });
  });
  
  return server;
};

/**
 * Generate Diffie-Hellman parameters
 */
const generateDHParameters = () => {
  const dhPath = path.join(__dirname, '../ssl/dhparam.pem');
  
  // Generate if not exists
  if (!fs.existsSync(dhPath)) {
    const { execSync } = require('child_process');
    try {
      execSync(`openssl dhparam -out ${dhPath} 2048`, { stdio: 'inherit' });
    } catch (error) {
      console.warn('Failed to generate DH parameters, using fallback');
      return null;
    }
  }
  
  return fs.readFileSync(dhPath);
};

/**
 * SSL Certificate monitoring and renewal
 */
const monitorCertificate = (certPath, keyPath, options = {}) => {
  const { daysBeforeExpiry = 30 } = options;
  
  const checkCertificate = () => {
    try {
      const cert = fs.readFileSync(certPath);
      const certInfo = new crypto.X509Certificate(cert);
      
      const now = new Date();
      const expiryDate = new Date(certInfo.validTo);
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= daysBeforeExpiry) {
        console.warn(`Certificate expires in ${daysUntilExpiry} days!`);
        
        // Log for monitoring
        require('./logger').auditLog('CERTIFICATE_EXPIRY_WARNING', null, null, null, {
          expiryDate: certInfo.validTo,
          daysUntilExpiry,
          subject: certInfo.subject
        });
        
        // Trigger renewal process if callback provided
        if (options.onExpiryWarning) {
          options.onExpiryWarning(daysUntilExpiry, certInfo);
        }
      }
      
      return {
        valid: daysUntilExpiry > 0,
        daysUntilExpiry,
        expiryDate: certInfo.validTo,
        subject: certInfo.subject,
        issuer: certInfo.issuer
      };
    } catch (error) {
      console.error('Error reading certificate:', error.message);
      return null;
    }
  };
  
  // Check immediately and then daily
  checkCertificate();
  setInterval(checkCertificate, 24 * 60 * 60 * 1000); // Daily check
  
  return { checkCertificate };
};

/**
 * SSL/TLS Security Headers Middleware
 */
const sslSecurityHeaders = (options = {}) => {
  return (req, res, next) => {
    // HSTS
    if (options.hsts !== false) {
      const hstsDirectives = options.hsts || HSTS_CONFIG.directives;
      res.setHeader('Strict-Transport-Security', hstsDirectives);
    }
    
    // Certificate Pinning
    if (options.enablePinning && req.protocol === 'https') {
      res.setHeader('Public-Key-Pins', CERTIFICATE_PINS.join(' '));
    }
    
    // Expect-CT header
    if (options.expectCT) {
      res.setHeader('Expect-CT', 'max-age=86400, enforce, report-uri="https://your-domain.com/ct-report"');
    }
    
    // Feature Policy / Permissions Policy
    res.setHeader('Permissions-Policy', 
      'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
    );
    
    next();
  };
};

/**
 * SSL Configuration validation
 */
const validateSSLConfig = (sslOptions) => {
  const issues = [];
  
  // Check protocol versions
  if (sslOptions.minVersion && sslOptions.minVersion !== 'TLSv1.2') {
    issues.push('Minimum TLS version should be TLSv1.2 or higher');
  }
  
  // Check cipher suites
  if (sslOptions.ciphers) {
    const weakCiphers = [
      'RC4', 'DES', '3DES', 'MD5', 'SHA1', 'NULL', 'EXPORT', 'ADH', 'AECDH'
    ];
    
    weakCiphers.forEach(cipher => {
      if (sslOptions.ciphers.includes(cipher)) {
        issues.push(`Weak cipher detected: ${cipher}`);
      }
    });
  }
  
  // Check certificate validity
  if (sslOptions.cert && sslOptions.key) {
    try {
      const cert = new crypto.X509Certificate(sslOptions.cert);
      const now = new Date();
      const notBefore = new Date(cert.validFrom);
      const notAfter = new Date(cert.validTo);
      
      if (now < notBefore) {
        issues.push('Certificate is not yet valid');
      }
      
      if (now > notAfter) {
        issues.push('Certificate has expired');
      }
    } catch (error) {
      issues.push('Invalid certificate format');
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendations: [
      'Use TLS 1.3 when possible',
      'Enable OCSP stapling',
      'Implement certificate pinning',
      'Use strong cipher suites only',
      'Enable perfect forward secrecy'
    ]
  };
};

/**
 * SSL Performance monitoring
 */
const monitorSSLPerformance = () => {
  const metrics = {
    connections: 0,
    handshakes: 0,
    errors: 0,
    protocols: {},
    ciphers: {}
  };
  
  return {
    recordConnection: (protocol, cipher) => {
      metrics.connections++;
      metrics.protocols[protocol] = (metrics.protocols[protocol] || 0) + 1;
      metrics.ciphers[cipher] = (metrics.ciphers[cipher] || 0) + 1;
    },
    
    recordHandshake: () => {
      metrics.handshakes++;
    },
    
    recordError: () => {
      metrics.errors++;
    },
    
    getMetrics: () => ({ ...metrics }),
    
    reset: () => {
      metrics.connections = 0;
      metrics.handshakes = 0;
      metrics.errors = 0;
      metrics.protocols = {};
      metrics.ciphers = {};
    }
  };
};

module.exports = {
  SSL_CONFIG,
  HSTS_CONFIG,
  CERTIFICATE_PINS,
  generateSecureCertificate,
  createSecureServer,
  generateDHParameters,
  monitorCertificate,
  sslSecurityHeaders,
  validateSSLConfig,
  monitorSSLPerformance
};
