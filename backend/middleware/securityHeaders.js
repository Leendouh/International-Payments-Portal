const helmet = require('helmet');

/**
 * Security Headers Middleware
 * Implements comprehensive security headers as per Task 1 requirements
 */
const securityHeaders = helmet({
  // Content Security Policy - Prevents XSS and clickjacking
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"], // No unsafe-inline for scripts in production
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"], // Prevents clickjacking
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'"],
      upgradeInsecureRequests: [], // Force HTTPS
    },
  },
  
  // Strict Transport Security - Forces HTTPS
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // X-Frame-Options - Prevents clickjacking
  frameguard: {
    action: 'deny'
  },
  
  // X-Content-Type-Options - Prevents MIME sniffing
  noSniff: true,
  
  // Referrer Policy - Controls referrer information
  referrerPolicy: {
    policy: ['strict-origin-when-cross-origin']
  },
  
  // X-XSS-Protection - Legacy XSS protection (defense-in-depth)
  xssFilter: true,
  
  // Permissions Policy - Restricts browser features
  permissionsPolicy: {
    features: {
      geolocation: ["'none'"],
      microphone: ["'none'"],
      camera: ["'none'"],
      payment: ["'none'"],
      usb: ["'none'"],
      magnetometer: ["'none'"],
      gyroscope: ["'none'"],
      accelerometer: ["'none'"]
    }
  }
});

module.exports = securityHeaders;
