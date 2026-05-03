const { body, validationResult } = require('express-validator');
const { auditLog } = require('../utils/logger');

/**
 * Input Validation Middleware
 * Implements whitelist validation with RegEx patterns as per Task 1 requirements
 */

// South African ID number validation (Luhn algorithm)
const validateSAId = (idNumber) => {
  if (!/^\d{13}$/.test(idNumber)) return false;
  
  let sum = 0;
  let alternate = false;
  
  for (let i = idNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(idNumber.charAt(i), 10);
    
    if (alternate) {
      digit *= 2;
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
    }
    
    sum += digit;
    alternate = !alternate;
  }
  
  return sum % 10 === 0;
};

// Validation chains for different endpoints
const registrationValidation = [
  // Full name validation - letters, spaces, hyphens, apostrophes only
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Full name can only contain letters, spaces, hyphens, and apostrophes'),
  
  // South African ID number validation
  body('idNumber')
    .trim()
    .isLength({ min: 13, max: 13 })
    .withMessage('ID number must be exactly 13 digits')
    .isNumeric()
    .withMessage('ID number must contain only digits')
    .custom(validateSAId)
    .withMessage('Invalid South African ID number'),
  
  // Account number validation - numeric only, 6-16 digits
  body('accountNumber')
    .trim()
    .isLength({ min: 6, max: 16 })
    .withMessage('Account number must be between 6 and 16 digits')
    .isNumeric()
    .withMessage('Account number must contain only digits'),
  
  // Email validation
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email address too long'),
  
  // Password validation - minimum 12 characters with complexity requirements
  body('password')
    .isLength({ min: 12 })
    .withMessage('Password must be at least 12 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character'),
  
  // Password confirmation
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    })
];

const loginValidation = [
  // Email validation
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  
  // Account number validation
  body('accountNumber')
    .trim()
    .isLength({ min: 6, max: 16 })
    .withMessage('Account number must be between 6 and 16 digits')
    .isNumeric()
    .withMessage('Account number must contain only digits'),
  
  // Password validation
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const paymentValidation = [
  // Amount validation - numeric with two decimal places
  body('amount')
    .isDecimal({ decimal_digits: '1,2' })
    .withMessage('Amount must be a valid decimal number with up to 2 decimal places')
    .isFloat({ min: 0.01, max: 1000000 })
    .withMessage('Amount must be between 0.01 and 1,000,000'),
  
  // Currency validation - whitelist specific currencies
  body('currency')
    .trim()
    .isIn(['ZAR', 'USD', 'EUR', 'GBP'])
    .withMessage('Currency must be one of: ZAR, USD, EUR, GBP'),
  
  // Provider validation - only SWIFT for now
  body('provider')
    .trim()
    .isIn(['SWIFT'])
    .withMessage('Provider must be SWIFT'),
  
  // SWIFT/BIC code validation - 8 or 11 alphanumeric characters
  body('swiftBic')
    .trim()
    .isLength({ min: 8, max: 11 })
    .withMessage('SWIFT/BIC code must be 8 or 11 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('SWIFT/BIC code can only contain uppercase letters and numbers'),
  
  // Recipient account validation
  body('recipientAccount')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Recipient account must be between 1 and 50 characters')
    .matches(/^[A-Za-z0-9\s\-]+$/)
    .withMessage('Recipient account can only contain letters, numbers, spaces, and hyphens')
];

// Generic validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    auditLog('INPUT_VALIDATION_FAILED', req.user?.id, req.ip, req.get('User-Agent'), {
      endpoint: req.path,
      method: req.method,
      errors: errorDetails
    });
    
    return res.status(400).json({
      error: 'Input validation failed',
      details: errorDetails
    });
  }
  
  next();
};

// Custom validator for SWIFT/BIC codes (optional enhanced validation)
const validateSwiftBic = (bic) => {
  // Basic format validation (already done above)
  if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic)) {
    return false;
  }
  
  // In production, you could validate against official SWIFT directory
  // For now, just ensure the format is correct
  return true;
};

module.exports = {
  registrationValidation,
  loginValidation,
  paymentValidation,
  handleValidationErrors,
  validateSAId,
  validateSwiftBic
};
