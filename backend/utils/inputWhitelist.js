/**
 * Comprehensive Input Whitelisting System
 * Implements exceptional input validation with extensive RegEx patterns
 */

const crypto = require('crypto');

// Comprehensive whitelist patterns for different input types
const WHITELIST_PATTERNS = {
  // Personal Information Patterns
  fullName: {
    pattern: /^[a-zA-Z\s'-]{2,50}$/,
    description: 'Full name with letters, spaces, hyphens, and apostrophes',
    examples: ['John Doe', 'Mary-Jane Smith', "O'Connor"],
    maxLength: 50,
    minLength: 2,
    sanitize: true
  },
  
  email: {
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    description: 'Valid email address format',
    examples: ['user@example.com', 'john.doe@company.co.uk'],
    maxLength: 254,
    minLength: 5,
    sanitize: true,
    normalizeEmail: true
  },
  
  idNumber: {
    pattern: /^[0-9]{8,13}$/,
    description: 'ID number with 8-13 digits',
    examples: ['1234567890123', '87654321'],
    maxLength: 13,
    minLength: 8,
    sanitize: true
  },
  
  accountNumber: {
    pattern: /^[0-9]{8,20}$/,
    description: 'Bank account number with 8-20 digits',
    examples: ['1234567890', '98765432109876543210'],
    maxLength: 20,
    minLength: 8,
    sanitize: true
  },
  
  // Payment Information Patterns
  amount: {
    pattern: /^\d{1,8}(\.\d{1,2})?$/,
    description: 'Monetary amount with up to 8 digits and 2 decimal places',
    examples: ['100', '1234.56', '99999999.99'],
    maxLength: 11,
    minLength: 1,
    sanitize: true,
    numeric: true
  },
  
  currency: {
    pattern: /^[A-Z]{3}$/,
    description: '3-letter ISO currency code',
    examples: ['USD', 'EUR', 'GBP', 'ZAR'],
    maxLength: 3,
    minLength: 3,
    sanitize: true,
    allowedValues: ['USD', 'EUR', 'GBP', 'ZAR', 'AUD', 'CAD', 'CHF', 'JPY', 'CNY', 'INR']
  },
  
  swiftBic: {
    pattern: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
    description: 'SWIFT/BIC code format',
    examples: ['ABCDUS33', 'BARCGB22XXX', 'SARBZAJJ'],
    maxLength: 11,
    minLength: 8,
    sanitize: true
  },
  
  recipientAccount: {
    pattern: /^[A-Z0-9]{8,34}$/,
    description: 'International account number (IBAN-like format)',
    examples: ['GB82WEST12345698765432', 'US12345678901234567890'],
    maxLength: 34,
    minLength: 8,
    sanitize: true
  },
  
  // Security Patterns
  password: {
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{}|;:,.<>?]{12,128}$/,
    description: 'Strong password with mixed case, numbers, and special characters',
    examples: ['StrongP@ssw0rd!', 'MyS3cure#Pass'],
    maxLength: 128,
    minLength: 12,
    sanitize: false // Don't sanitize passwords
  },
  
  // General Text Patterns
  message: {
    pattern: /^[a-zA-Z0-9\s.,!?;:'"()-]{1,500}$/,
    description: 'General message text with common punctuation',
    examples: ['Hello, world!', 'Payment completed successfully.'],
    maxLength: 500,
    minLength: 1,
    sanitize: true
  },
  
  description: {
    pattern: /^[a-zA-Z0-9\s.,!?;:'"()\-]{1,200}$/,
    description: 'Payment description or reference',
    examples: ['Salary payment', 'Invoice #12345'],
    maxLength: 200,
    minLength: 1,
    sanitize: true
  },
  
  // System Patterns
  sessionId: {
    pattern: /^[a-zA-Z0-9\-_]{32,64}$/,
    description: 'Session identifier',
    examples: ['abc123def456ghi789jkl012mno345pqr678stu901vwx'],
    maxLength: 64,
    minLength: 32,
    sanitize: true
  },
  
  token: {
    pattern: /^[a-zA-Z0-9._-]+$/,
    description: 'JWT token or API token',
    examples: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'],
    maxLength: 2048,
    minLength: 10,
    sanitize: false
  },
  
  // Address Patterns
  address: {
    pattern: /^[a-zA-Z0-9\s.,#\-\/]{5,100}$/,
    description: 'Street address',
    examples: ['123 Main St, Apt 4B', '456 Oak Avenue'],
    maxLength: 100,
    minLength: 5,
    sanitize: true
  },
  
  city: {
    pattern: /^[a-zA-Z\s\-']{2,50}$/,
    description: 'City name',
    examples: ['New York', 'Los Angeles', "St. John's"],
    maxLength: 50,
    minLength: 2,
    sanitize: true
  },
  
  postalCode: {
    pattern: /^[a-zA-Z0-9\s\-]{3,10}$/,
    description: 'Postal/ZIP code',
    examples: ['12345', 'SW1A 1AA', '90210-1234'],
    maxLength: 10,
    minLength: 3,
    sanitize: true
  },
  
  // Phone Patterns
  phoneNumber: {
    pattern: /^\+?[1-9]\d{1,14}$/,
    description: 'International phone number',
    examples: ['+1234567890', '15551234567'],
    maxLength: 15,
    minLength: 7,
    sanitize: true
  },
  
  // ID Patterns
  userId: {
    pattern: /^\d+$/,
    description: 'Numeric user ID',
    examples: ['123', '456789'],
    maxLength: 10,
    minLength: 1,
    sanitize: true,
    numeric: true
  },
  
  transactionId: {
    pattern: /^[a-zA-Z0-9\-_]{10,50}$/,
    description: 'Transaction identifier',
    examples: ['TXN-123-ABC', 'payment_456789'],
    maxLength: 50,
    minLength: 10,
    sanitize: true
  },
  
  // File Patterns
  fileName: {
    pattern: /^[a-zA-Z0-9._-]{1,255}$/,
    description: 'File name with safe characters',
    examples: ['document.pdf', 'image_123.jpg'],
    maxLength: 255,
    minLength: 1,
    sanitize: true
  },
  
  fileType: {
    pattern: /^[a-zA-Z0-9]+\/[a-zA-Z0-9\-+.]+$/,
    description: 'MIME type',
    examples: ['image/jpeg', 'application/pdf', 'text/plain'],
    maxLength: 100,
    minLength: 3,
    sanitize: true
  }
};

// Advanced sanitization functions
const sanitizers = {
  // Remove potentially dangerous characters
  removeDangerousChars: (input) => {
    return input.replace(/[<>'"&]/g, '');
  },
  
  // Normalize whitespace
  normalizeWhitespace: (input) => {
    return input.replace(/\s+/g, ' ').trim();
  },
  
  // Remove control characters
  removeControlChars: (input) => {
    return input.replace(/[\x00-\x1F\x7F]/g, '');
  },
  
  // Normalize email (lowercase)
  normalizeEmail: (input) => {
    return input.toLowerCase().trim();
  },
  
  // Remove SQL injection patterns
  removeSQLInjection: (input) => {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(--|;|\/\*|\*\/|xp_|sp_)/gi,
      /(\bOR\b.*=.*\bOR\b)/gi,
      /(\bAND\b.*=.*\bAND\b)/gi
    ];
    
    let sanitized = input;
    sqlPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    return sanitized;
  },
  
  // Remove XSS patterns
  removeXSS: (input) => {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<[^>]*>/g
    ];
    
    let sanitized = input;
    xssPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    return sanitized;
  },
  
  // Remove path traversal patterns
  removePathTraversal: (input) => {
    return input.replace(/\.\./g, '').replace(/[\/\\]/g, '');
  }
};

/**
 * Validate input against whitelist pattern
 */
const validateInput = (input, type, options = {}) => {
  const pattern = WHITELIST_PATTERNS[type];
  
  if (!pattern) {
    return {
      isValid: false,
      error: `Unknown input type: ${type}`,
      sanitizedInput: null
    };
  }
  
  if (typeof input !== 'string') {
    return {
      isValid: false,
      error: `Input must be a string for type: ${type}`,
      sanitizedInput: null
    };
  }
  
  let sanitizedInput = input;
  
  // Apply sanitization if enabled
  if (pattern.sanitize !== false) {
    sanitizedInput = sanitizers.removeDangerousChars(sanitizedInput);
    sanitizedInput = sanitizers.removeControlChars(sanitizedInput);
    sanitizedInput = sanitizers.removeSQLInjection(sanitizedInput);
    sanitizedInput = sanitizers.removeXSS(sanitizedInput);
    sanitizedInput = sanitizers.normalizeWhitespace(sanitizedInput);
    
    if (type === 'email' && pattern.normalizeEmail) {
      sanitizedInput = sanitizers.normalizeEmail(sanitizedInput);
    }
  }
  
  // Check length requirements
  if (sanitizedInput.length < pattern.minLength) {
    return {
      isValid: false,
      error: `Input too short for ${type}. Minimum length: ${pattern.minLength}`,
      sanitizedInput
    };
  }
  
  if (sanitizedInput.length > pattern.maxLength) {
    return {
      isValid: false,
      error: `Input too long for ${type}. Maximum length: ${pattern.maxLength}`,
      sanitizedInput
    };
  }
  
  // Check pattern match
  if (!pattern.pattern.test(sanitizedInput)) {
    return {
      isValid: false,
      error: `Invalid format for ${type}. Expected: ${pattern.description}`,
      sanitizedInput,
      examples: pattern.examples
    };
  }
  
  // Check allowed values if specified
  if (pattern.allowedValues && !pattern.allowedValues.includes(sanitizedInput)) {
    return {
      isValid: false,
      error: `Invalid value for ${type}. Allowed values: ${pattern.allowedValues.join(', ')}`,
      sanitizedInput
    };
  }
  
  // Convert to number if numeric
  if (pattern.numeric) {
    const numValue = parseFloat(sanitizedInput);
    if (isNaN(numValue)) {
      return {
        isValid: false,
        error: `Invalid numeric value for ${type}`,
        sanitizedInput
      };
    }
    return {
      isValid: true,
      sanitizedInput: numValue
    };
  }
  
  return {
    isValid: true,
    sanitizedInput
  };
};

/**
 * Validate multiple inputs
 */
const validateMultipleInputs = (inputs, schema) => {
  const results = {};
  const errors = [];
  
  for (const [field, type] of Object.entries(schema)) {
    const input = inputs[field];
    
    if (input === undefined || input === null || input === '') {
      if (type.required) {
        errors.push(`${field} is required`);
      }
      continue;
    }
    
    const validation = validateInput(input, type.name || type, type.options);
    
    if (validation.isValid) {
      results[field] = validation.sanitizedInput;
    } else {
      errors.push(`${field}: ${validation.error}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    sanitizedInputs: results,
    errors
  };
};

/**
 * Create validation schema for common forms
 */
const schemas = {
  registration: {
    fullName: { type: 'fullName', required: true },
    email: { type: 'email', required: true },
    idNumber: { type: 'idNumber', required: true },
    accountNumber: { type: 'accountNumber', required: true },
    password: { type: 'password', required: true }
  },
  
  login: {
    email: { type: 'email', required: true },
    password: { type: 'password', required: true },
    accountNumber: { type: 'accountNumber', required: true }
  },
  
  payment: {
    amount: { type: 'amount', required: true },
    currency: { type: 'currency', required: true },
    provider: { type: 'swiftBic', required: true },
    recipientAccount: { type: 'recipientAccount', required: true },
    description: { type: 'description', required: false }
  },
  
  profileUpdate: {
    fullName: { type: 'fullName', required: false },
    phoneNumber: { type: 'phoneNumber', required: false },
    address: { type: 'address', required: false },
    city: { type: 'city', required: false },
    postalCode: { type: 'postalCode', required: false }
  }
};

/**
 * Get pattern information for documentation
 */
const getPatternInfo = (type) => {
  return WHITELIST_PATTERNS[type] || null;
};

/**
 * Get all available patterns
 */
const getAllPatterns = () => {
  return WHITELIST_PATTERNS;
};

/**
 * Custom pattern registration
 */
const registerPattern = (name, pattern) => {
  WHITELIST_PATTERNS[name] = pattern;
};

/**
 * Input validation middleware for Express
 */
const createValidationMiddleware = (schema) => {
  return (req, res, next) => {
    const validation = validateMultipleInputs(req.body, schema);
    
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validation.errors
      });
    }
    
    // Replace request body with sanitized inputs
    req.body = validation.sanitizedInputs;
    next();
  };
};

module.exports = {
  WHITELIST_PATTERNS,
  sanitizers,
  validateInput,
  validateMultipleInputs,
  schemas,
  getPatternInfo,
  getAllPatterns,
  registerPattern,
  createValidationMiddleware
};
