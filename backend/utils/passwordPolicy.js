/**
 * Password Security Policy Implementation
 * Implements comprehensive password requirements for exceptional security
 */

const crypto = require('node:crypto');

// Password complexity requirements
const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minUppercase: 1,
  minLowercase: 1,
  minNumbers: 1,
  minSpecialChars: 1,
  // Prevent common password patterns
  preventSequentialChars: true,
  preventRepeatingChars: true,
  preventCommonPasswords: true,
  maxRepeatingChars: 2,
  // Advanced requirements
  preventPersonalInfo: true,
  preventDictionaryWords: true,
  requireNoWhitespace: true
};

// Common weak passwords to block
const COMMON_PASSWORDS = new Set([
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'qwerty123', 'admin123', 'root', 'toor', 'pass', 'test', 'guest',
  'user', 'login', 'default', 'changeme', 'secret', 'master'
]);

// Dictionary words to prevent (simplified list)
const DICTIONARY_WORDS = new Set([
  'password', 'admin', 'user', 'login', 'welcome', 'security', 'access',
  'account', 'system', 'network', 'server', 'database', 'computer',
  'internet', 'online', 'digital', 'cyber', 'tech', 'software', 'hardware'
]);

// Special characters allowed
const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Validate password against comprehensive security policy
 */
const validatePassword = (password, userInfo = {}) => {
  const errors = [];
  const warnings = [];

  // Basic length validation
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }
  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`);
  }

  // Character type requirements
  const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
  const lowercaseCount = (password.match(/[a-z]/g) || []).length;
  const numberCount = (password.match(/[0-9]/g) || []).length;
  const specialCharCount = (password.match(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g) || []).length;

  if (PASSWORD_REQUIREMENTS.requireUppercase && uppercaseCount < PASSWORD_REQUIREMENTS.minUppercase) {
    errors.push(`Password must contain at least ${PASSWORD_REQUIREMENTS.minUppercase} uppercase letter`);
  }
  if (PASSWORD_REQUIREMENTS.requireLowercase && lowercaseCount < PASSWORD_REQUIREMENTS.minLowercase) {
    errors.push(`Password must contain at least ${PASSWORD_REQUIREMENTS.minLowercase} lowercase letter`);
  }
  if (PASSWORD_REQUIREMENTS.requireNumbers && numberCount < PASSWORD_REQUIREMENTS.minNumbers) {
    errors.push(`Password must contain at least ${PASSWORD_REQUIREMENTS.minNumbers} number`);
  }
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && specialCharCount < PASSWORD_REQUIREMENTS.minSpecialChars) {
    errors.push(`Password must contain at least ${PASSWORD_REQUIREMENTS.minSpecialChars} special character`);
  }

  // Advanced security checks
  if (PASSWORD_REQUIREMENTS.requireNoWhitespace && /\s/.test(password)) {
    errors.push('Password must not contain whitespace characters');
  }

  // Prevent sequential characters
  if (PASSWORD_REQUIREMENTS.preventSequentialChars) {
    for (let i = 0; i < password.length - 2; i++) {
      const char1 = password.charCodeAt(i);
      const char2 = password.charCodeAt(i + 1);
      const char3 = password.charCodeAt(i + 2);
      
      if (char2 === char1 + 1 && char3 === char2 + 1) {
        errors.push('Password must not contain sequential characters (e.g., "abc", "123")');
        break;
      }
    }
  }

  // Prevent repeating characters
  if (PASSWORD_REQUIREMENTS.preventRepeatingChars) {
    const repeats = password.match(/(.)\1{2,}/g);
    if (repeats) {
      errors.push('Password must not contain repeating characters (e.g., "aaa", "111")');
    }
  }

  // Check for common passwords
  if (PASSWORD_REQUIREMENTS.preventCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    for (const commonPwd of COMMON_PASSWORDS) {
      if (lowerPassword.includes(commonPwd)) {
        errors.push('Password must not contain common password patterns');
        break;
      }
    }
  }

  // Prevent personal information
  if (PASSWORD_REQUIREMENTS.preventPersonalInfo && userInfo) {
    const personalFields = ['email', 'fullName', 'idNumber', 'accountNumber'];
    for (const field of personalFields) {
      if (userInfo[field]) {
        const fieldValue = userInfo[field].toLowerCase();
        const passwordLower = password.toLowerCase();
        if (passwordLower.includes(fieldValue) || fieldValue.includes(passwordLower)) {
          errors.push('Password must not contain personal information');
          break;
        }
      }
    }
  }

  // Prevent dictionary words
  if (PASSWORD_REQUIREMENTS.preventDictionaryWords) {
    const passwordWords = password.toLowerCase().split(/[^a-z]/);
    for (const word of passwordWords) {
      if (word.length >= 4 && DICTIONARY_WORDS.has(word)) {
        errors.push('Password must not contain common dictionary words');
        break;
      }
    }
  }

  // Calculate password strength score
  const strengthScore = calculatePasswordStrength(password);

  // Add warnings for weak but valid passwords
  if (strengthScore < 60 && errors.length === 0) {
    warnings.push('Password is valid but could be stronger for better security');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    strengthScore,
    strengthLabel: getStrengthLabel(strengthScore)
  };
};

/**
 * Calculate password strength score (0-100)
 */
const calculatePasswordStrength = (password) => {
  let score = 0;

  // Length contribution (up to 30 points)
  score += Math.min(password.length * 2, 30);

  // Character variety contribution (up to 40 points)
  if (/[a-z]/.test(password)) score += 8;
  if (/[A-Z]/.test(password)) score += 8;
  if (/[0-9]/.test(password)) score += 8;
  if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 8;
  if (/[^a-zA-Z0-9]/.test(password)) score += 8;

  // Complexity contribution (up to 30 points)
  const uniqueChars = new Set(password).size;
  score += Math.min(uniqueChars * 2, 20);

  // Bonus for avoiding common patterns
  if (!/(.)\1{2,}/.test(password)) score += 5; // No repeating chars
  if (!/123|abc|qwe/i.test(password)) score += 5; // No sequential patterns

  return Math.min(score, 100);
};

/**
 * Get strength label based on score
 */
const getStrengthLabel = (score) => {
  if (score >= 80) return 'Very Strong';
  if (score >= 60) return 'Strong';
  if (score >= 40) return 'Medium';
  if (score >= 20) return 'Weak';
  return 'Very Weak';
};

/**
 * Generate secure random password
 */
const generateSecurePassword = (length = 16) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + special;

  let password = '';
  
  // Ensure at least one of each required character type
  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];
  password += special[crypto.randomInt(0, special.length)];

  // Fill remaining length with random characters
  for (let i = 4; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => crypto.randomInt(-1, 2)).join('');
};

/**
 * Check if password needs to be changed (based on age and breaches)
 */
const shouldChangePassword = (passwordCreatedAt, lastChangedAt, breachDetected = false) => {
  const now = new Date();
  const passwordAge = now - new Date(passwordCreatedAt);
  const lastChangeAge = now - new Date(lastChangedAt);

  // Force change if breach detected
  if (breachDetected) return { required: true, reason: 'Security breach detected' };

  // Force change after 90 days
  if (passwordAge > 90 * 24 * 60 * 60 * 1000) {
    return { required: true, reason: 'Password expired (90 days)' };
  }

  // Suggest change after 60 days
  if (passwordAge > 60 * 24 * 60 * 60 * 1000) {
    return { required: false, reason: 'Password aging - consider changing' };
  }

  return { required: false, reason: null };
};

module.exports = {
  PASSWORD_REQUIREMENTS,
  SPECIAL_CHARS,
  validatePassword,
  calculatePasswordStrength,
  getStrengthLabel,
  generateSecurePassword,
  shouldChangePassword
};
