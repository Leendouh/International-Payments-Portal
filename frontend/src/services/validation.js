import { api } from './api';

/**
 * Real-time Field Validation Service
 * Validates individual fields immediately when user leaves them (on blur)
 */

class ValidationService {
  constructor() {
    this.cache = new Map(); // Cache validation results
    this.debounceTimers = new Map(); // Debounce rapid validation requests
  }

  /**
   * Validate full name in real-time
   * @param {string} fullName - Full name to validate
   * @returns {Promise<object>} - Validation result with error message if invalid
   */
  async validateFullName(fullName) {
    if (!fullName || fullName.trim().length === 0) {
      return { valid: false, error: 'Full name is required' };
    }

    const trimmedName = fullName.trim();
    
    if (trimmedName.length < 2) {
      return { valid: false, error: 'Full name must be at least 2 characters long' };
    }

    if (trimmedName.length > 100) {
      return { valid: false, error: 'Full name must be less than 100 characters' };
    }

    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(trimmedName)) {
      return { valid: false, error: 'Full name can only contain letters, spaces, hyphens, and apostrophes' };
    }

    // Check for at least two words (first name and last name)
    const words = trimmedName.trim().split(/\s+/);
    if (words.length < 2) {
      return { valid: false, error: 'Please enter both first name and last name' };
    }

    // Check each word is at least 2 characters
    const invalidWord = words.find(word => word.length < 2);
    if (invalidWord) {
      return { valid: false, error: 'Each name must be at least 2 characters long' };
    }

    return { valid: true };
  }

  /**
   * Validate email in real-time
   * @param {string} email - Email to validate
   * @returns {Promise<object>} - Validation result with error message if invalid
   */
  async validateEmail(email) {
    if (!email || email.trim().length === 0) {
      return { valid: false, error: 'Email is required' };
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }

    // More specific email validation
    const parts = trimmedEmail.split('@');
    if (parts.length !== 2) {
      return { valid: false, error: 'Email must contain exactly one @ symbol' };
    }

    const [localPart, domain] = parts;
    
    if (localPart.length < 1 || localPart.length > 64) {
      return { valid: false, error: 'Email username is invalid' };
    }

    if (domain.length < 4 || domain.length > 253) {
      return { valid: false, error: 'Email domain is invalid' };
    }

    // Check domain has valid format
    const domainParts = domain.split('.');
    if (domainParts.length < 2) {
      return { valid: false, error: 'Email domain must have at least one dot' };
    }

    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) {
      return { valid: false, error: 'Email domain extension is invalid' };
    }

    // Check if email already exists (server-side validation)
    try {
      const cacheKey = `email_${trimmedEmail}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const response = await api.post('/auth/validate/email', { email: trimmedEmail });
      const result = { valid: true };
      
      // Cache the result for 5 minutes
      this.cache.set(cacheKey, result);
      setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);
      
      return result;
    } catch (error) {
      if (error.response?.status === 409) {
        const result = { valid: false, error: 'Email already exists' };
        this.cache.set(`email_${trimmedEmail}`, result);
        return result;
      }
      // For other errors, allow but don't cache
      return { valid: true };
    }
  }

  /**
   * Validate RSA ID number in real-time
   * @param {string} idNumber - RSA ID number to validate
   * @returns {Promise<object>} - Validation result with error message if invalid
   */
  async validateRSAId(idNumber) {
    if (!idNumber || idNumber.trim().length === 0) {
      return { valid: false, error: 'RSA ID number is required' };
    }

    const trimmedId = idNumber.trim();
    
    // Must be exactly 13 digits
    if (!/^\d{13}$/.test(trimmedId)) {
      return { valid: false, error: 'RSA ID must be exactly 13 digits' };
    }

    // Check if it's a valid date (YYMMDD)
    const year = parseInt(trimmedId.substring(0, 2));
    const month = parseInt(trimmedId.substring(2, 4));
    const day = parseInt(trimmedId.substring(4, 6));
    
    if (month < 1 || month > 12) {
      return { valid: false, error: 'Invalid month in ID number' };
    }
    
    if (day < 1 || day > 31) {
      return { valid: false, error: 'Invalid day in ID number' };
    }

    // Determine full year (assuming 1900-1999 for year >= 50, 2000-2099 for year < 50)
    const fullYear = year >= 50 ? 1900 + year : 2000 + year;
    
    // Validate the date
    const date = new Date(fullYear, month - 1, day);
    if (date.getFullYear() !== fullYear || 
        date.getMonth() !== month - 1 || 
        date.getDate() !== day) {
      return { valid: false, error: 'Invalid date in ID number' };
    }

    // Check citizenship (0 = SA citizen, 1 = permanent resident)
    const citizenship = parseInt(trimmedId.substring(10, 11));
    if (citizenship !== 0 && citizenship !== 1) {
      return { valid: false, error: 'Invalid citizenship code in ID number' };
    }

    // Apply Luhn algorithm for checksum validation
    let sum = 0;
    let alternate = false;
    
    for (let i = trimmedId.length - 1; i >= 0; i--) {
      let digit = parseInt(trimmedId.charAt(i));
      
      if (alternate) {
        digit *= 2;
        if (digit > 9) {
          digit = Math.floor(digit / 10) + (digit % 10);
        }
      }
      
      sum += digit;
      alternate = !alternate;
    }
    
    if (sum % 10 !== 0) {
      return { valid: false, error: 'Invalid RSA ID number (checksum failed)' };
    }

    // Check if ID already exists (server-side validation)
    try {
      const cacheKey = `id_${trimmedId}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const response = await api.post('/auth/validate/idnumber', { idNumber: trimmedId });
      const result = { valid: true };
      
      // Cache the result for 5 minutes
      this.cache.set(cacheKey, result);
      setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);
      
      return result;
    } catch (error) {
      if (error.response?.status === 409) {
        const result = { valid: false, error: 'RSA ID number already exists' };
        this.cache.set(`id_${trimmedId}`, result);
        return result;
      }
      // For other errors, allow but don't cache
      return { valid: true };
    }
  }

  /**
   * Validate account number in real-time (for registration)
   * @param {string} accountNumber - Account number to validate
   * @returns {Promise<object>} - Validation result with error message if invalid
   */
  async validateAccountNumber(accountNumber) {
    if (!accountNumber || accountNumber.trim().length === 0) {
      return { valid: false, error: 'Account number is required' };
    }

    const trimmedAccount = accountNumber.trim();
    
    // Account number should be 10-12 digits
    if (!/^\d{10,12}$/.test(trimmedAccount)) {
      return { valid: false, error: 'Account number must be 10-12 digits' };
    }

    // Check if account already exists (server-side validation)
    try {
      const cacheKey = `account_${trimmedAccount}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const response = await api.post('/auth/validate/accountnumber', { accountNumber: trimmedAccount });
      const result = { valid: true };
      
      // Cache the result for 5 minutes
      this.cache.set(cacheKey, result, 300000);
      return result;
    } catch (error) {
      if (error.response?.status === 409) {
        const result = { valid: false, error: 'Account number already exists' };
        const cacheKey = `account_${trimmedAccount}`;
        this.cache.set(cacheKey, result, 300000);
        return result;
      }
      
      console.error('Account number validation error:', error);
      return { valid: false, error: 'Validation failed' };
    }
  }

  /**
   * Validate account number for login (more flexible)
   * @param {string} accountNumber - Account number to validate
   * @returns {Promise<object>} - Validation result with error message if invalid
   */
  async validateLoginAccountNumber(accountNumber) {
    if (!accountNumber || accountNumber.trim().length === 0) {
      return { valid: false, error: 'Account number is required' };
    }

    const trimmedAccount = accountNumber.trim();
    
    // For login, be more flexible - accept 8-12 digits
    if (!/^\d{8,12}$/.test(trimmedAccount)) {
      return { valid: false, error: 'Account number must be 8-12 digits' };
    }

    // For login, we don't check if account exists - that's handled by the login process
    return { valid: true };
  }

  /**
   * Validate password in real-time
   * @param {string} password - Password to validate
   * @param {string} confirmPassword - Confirm password (optional)
   * @returns {Promise<object>} - Validation result with error message if invalid
   */
  async validatePassword(password, confirmPassword = null) {
    if (!password || password.length === 0) {
      return { valid: false, error: 'Password is required' };
    }

    // Password length validation
    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long' };
    }

    if (password.length > 128) {
      return { valid: false, error: 'Password must be less than 128 characters' };
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one uppercase letter' };
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one lowercase letter' };
    }

    // Check for at least one digit
    if (!/\d/.test(password)) {
      return { valid: false, error: 'Password must contain at least one number' };
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one special character' };
    }

    // Check for common weak patterns
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /letmein/i,
      /welcome/i
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        return { valid: false, error: 'Password contains common patterns that are not allowed' };
      }
    }

    // Check for sequential characters
    const hasSequentialChars = (str) => {
      for (let i = 0; i < str.length - 2; i++) {
        const char1 = str.charCodeAt(i);
        const char2 = str.charCodeAt(i + 1);
        const char3 = str.charCodeAt(i + 2);
        
        if (char2 === char1 + 1 && char3 === char2 + 1) {
          return true;
        }
        if (char2 === char1 - 1 && char3 === char2 - 1) {
          return true;
        }
      }
      return false;
    };

    if (hasSequentialChars(password.toLowerCase())) {
      return { valid: false, error: 'Password should not contain sequential characters' };
    }

    // If confirm password provided, check if they match
    if (confirmPassword != null && password !== confirmPassword) {
      return { valid: false, error: 'Passwords do not match' };
    }

    return { valid: true };
  }

  /**
   * Validate login email
   * @param {string} email - Email to validate
   * @returns {Promise<object>} - Validation result
   */
  async validateLoginEmail(email) {
    const result = await this.validateEmail(email);
    // For login, we don't check if email exists, just format
    if (result.error === 'Email already exists') {
      return { valid: true };
    }
    return result;
  }

  /**
   * Validate login password
   * @param {string} password - Password to validate
   * @returns {Promise<object>} - Validation result
   */
  async validateLoginPassword(password) {
    if (!password || password.length === 0) {
      return { valid: false, error: 'Password is required' };
    }
    
    if (password.length < 1) {
      return { valid: false, error: 'Password cannot be empty' };
    }

    return { valid: true };
  }

  /**
   * Clear validation cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Cancel pending validation requests
   */
  cancelPendingRequests() {
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

// Create singleton instance
const validationService = new ValidationService();

export default validationService;
