const { body, validationResult } = require('express-validator');
const { auditLog } = require('../utils/logger');
const { 
  validateInput, 
  validateMultipleInputs, 
  schemas,
  createValidationMiddleware 
} = require('../utils/inputWhitelist');

/**
 * Enhanced Input Validation Middleware
 * Implements comprehensive whitelist validation with extensive RegEx patterns
 */

// South African ID number validation (Luhn algorithm)
const validateSAId = (idNumber) => {
  if (!/^\d{13}$/.test(idNumber)) return false;
  
  let sum = 0;
  let alternate = false;
  
  for (let i = idNumber.length - 1; i >= 0; i--) {
    let digit = Number.parseInt(idNumber.charAt(i), 10);
    
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

// Enhanced validation chains using comprehensive whitelisting
const registrationValidation = [
  // Enhanced full name validation with whitelist
  body('fullName').custom((value) => {
    const validation = validateInput(value, 'fullName');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    return true;
  }),
  
  // Enhanced email validation with whitelist
  body('email').custom((value) => {
    const validation = validateInput(value, 'email');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    return true;
  }),
  
  // Enhanced ID number validation with whitelist and SA ID validation
  body('idNumber').custom((value) => {
    const validation = validateInput(value, 'idNumber');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    // Additional SA ID validation for 13-digit IDs
    if (value.length === 13 && !validateSAId(value)) {
      throw new Error('Invalid South African ID number - failed Luhn algorithm check');
    }
    return true;
  }),
  
  // Enhanced account number validation with whitelist
  body('accountNumber').custom((value) => {
    const validation = validateInput(value, 'accountNumber');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    return true;
  }),
  
  // Enhanced password validation with whitelist
  body('password').custom((value) => {
    const validation = validateInput(value, 'password');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    return true;
  }),
  
  ];

const loginValidation = [
  // Enhanced email validation with whitelist
  body('email').notEmpty().withMessage('Email is required').custom((value) => {
    const validation = validateInput(value, 'email');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    return true;
  }),
  
  // Enhanced account number validation with whitelist
  body('accountNumber').notEmpty().withMessage('Account number is required').custom((value) => {
    const validation = validateInput(value, 'accountNumber');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    return true;
  }),
  
  // Enhanced password validation with whitelist
  body('password').notEmpty().withMessage('Password is required').custom((value) => {
    const validation = validateInput(value, 'password');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    return true;
  })
];

// Enhanced payment validation with comprehensive whitelisting
const paymentValidation = [
  // Enhanced amount validation with whitelist
  body('amount').custom((value) => {
    const validation = validateInput(value.toString(), 'amount');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    return true;
  }),
  
  // Enhanced currency validation with whitelist
  body('currency').custom((value) => {
    const validation = validateInput(value, 'currency');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    return true;
  }),
  
  // Enhanced SWIFT/BIC validation with whitelist
  body('swiftBic').custom((value) => {
    const validation = validateInput(value, 'swiftBic');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    return true;
  }),
  
  // Enhanced recipient account validation with whitelist
  body('recipientAccount').custom((value) => {
    const validation = validateInput(value, 'recipientAccount');
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    return true;
  }),
  
  // Enhanced description validation with whitelist
  body('description').optional().custom((value) => {
    if (value) {
      const validation = validateInput(value, 'description');
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
    }
    return true;
  })
];

// New comprehensive validation middleware using schemas
const enhancedRegistrationValidation = createValidationMiddleware(schemas.registration);
const enhancedLoginValidation = createValidationMiddleware(schemas.login);
const enhancedPaymentValidation = createValidationMiddleware(schemas.payment);

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    const validation = validateMultipleInputs(req.body, {});
    if (validation.sanitizedInputs) {
      // Only replace body if sanitization produced a valid result
      // Otherwise preserve the original body
      if (Object.keys(validation.sanitizedInputs).length > 0) {
        req.body = validation.sanitizedInputs;
      }
    }
  }
  next();
};

// Generic validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    console.log('Validation errors:', errorDetails);
    
    auditLog('INPUT_VALIDATION_FAILED', req.user?.id, req.ip, req.get('User-Agent'), {
      endpoint: req.path,
      method: req.method,
      errors: errorDetails
    });
    
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errorDetails
    });
  }
  
  next();
};

// Custom validator for SWIFT/BIC codes (optional enhanced validation)
const validateSwiftBic = (bic) => {
  // Basic format validation (already done above)
  // In production, you could validate against official SWIFT directory
  // For now, just ensure the format is correct
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic);
};

module.exports = {
  registrationValidation,
  loginValidation,
  paymentValidation,
  enhancedRegistrationValidation,
  enhancedLoginValidation,
  enhancedPaymentValidation,
  sanitizeInput,
  validateSAId,
  validateSwiftBic,
  handleValidationErrors,
  schemas,
  validateInput,
  validateMultipleInputs
};
