const winston = require('winston');
const path = require('path');

/**
 * Logging Utilities
 * Implements comprehensive audit logging as per Task 1 requirements
 */

// Table name for audit logs (matching existing schema)
const AUDIT_LOG_TABLE = 'audit_log';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
const fs = require('fs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'international-payments' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Audit log file (separate for security events)
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  ]
});

// Add console logging for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

/**
 * Log audit events to database and file system
 * @param {string} action - Action being performed
 * @param {number} customerId - Customer ID (if available)
 * @param {string} ipAddress - Client IP address
 * @param {string} userAgent - Client user agent
 * @param {object} details - Additional details about the event
 * @param {boolean} success - Whether the action was successful
 */
const auditLog = async (action, customerId, ipAddress, userAgent, details = {}, success = true) => {
  const auditEntry = {
    action,
    customer_id: customerId,
    ip_address: ipAddress,
    user_agent: userAgent,
    details: details,
    timestamp: new Date().toISOString(),
    success
  };

  // Log to file system
  logger.info('AUDIT_EVENT', auditEntry);

  // Also log to database for tamper-evident storage
  try {
    const db = require('./database');
    const query = `
      INSERT INTO audit_log (action, customer_id, ip_address, user_agent, details, success)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    
    await db.query(query, [
      action,
      customerId,
      ipAddress,
      userAgent,
      JSON.stringify(details),
      success
    ]);
  } catch (error) {
    // Log database errors but don't fail the operation
    logger.error('Failed to write audit log to database:', {
      error: error.message,
      auditEntry
    });
  }
};

/**
 * Log security events
 * @param {string} event - Security event type
 * @param {string} severity - Event severity (low, medium, high, critical)
 * @param {object} details - Event details
 */
const securityLog = (event, severity, details) => {
  const securityEntry = {
    event,
    severity,
    details,
    timestamp: new Date().toISOString()
  };

  logger.warn('SECURITY_EVENT', securityEntry);
};

/**
 * Log application errors
 * @param {Error} error - Error object
 * @param {object} context - Additional context
 */
const errorLog = (error, context = {}) => {
  const errorEntry = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  };

  logger.error('APPLICATION_ERROR', errorEntry);
};

/**
 * Log performance metrics
 * @param {string} operation - Operation being measured
 * @param {number} duration - Duration in milliseconds
 * @param {object} metadata - Additional metadata
 */
const performanceLog = (operation, duration, metadata = {}) => {
  const performanceEntry = {
    operation,
    duration,
    metadata,
    timestamp: new Date().toISOString()
  };

  logger.info('PERFORMANCE_METRIC', performanceEntry);
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request start
  logger.info('REQUEST_START', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    logger.info('REQUEST_END', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = {
  logger,
  auditLog,
  securityLog,
  errorLog,
  performanceLog,
  requestLogger
};
