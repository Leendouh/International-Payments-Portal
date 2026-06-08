const crypto = require('node:crypto');

/**
 * Hashing Utilities
 * Implements secure password hashing and data salting using Node.js built-in crypto
 */

const SALT_ROUNDS = 12; // For compatibility with previous requirements
const SCRYPT_PARAMS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }; // Secure scrypt parameters

/**
 * Hash a password using scrypt (Node.js built-in)
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password with salt
 */
const hashPassword = async (password) => {
  return new Promise((resolve, reject) => {
    // Generate a random salt
    const salt = crypto.randomBytes(16).toString('hex');
    
    crypto.scrypt(password, salt, 64, SCRYPT_PARAMS, (err, derivedKey) => {
      if (err) {
        console.error('Password hashing error:', err);
        reject(new Error('Password hashing failed'));
        return;
      }
      
      // Combine salt and hash for storage
      const hash = `${salt}:${derivedKey.toString('hex')}`;
      resolve(hash);
    });
  });
};

/**
 * Verify a password against its hash
 * @param {string} password - Plain text password
 * @param {string} storedHash - Hashed password with salt (format: salt:hash)
 * @returns {Promise<boolean>} - True if password matches
 */
const verifyPassword = async (password, storedHash) => {
  return new Promise((resolve, reject) => {
    try {
      const [salt, hash] = storedHash.split(':');
      if (!salt || !hash) {
        resolve(false);
        return;
      }
      
      crypto.scrypt(password, salt, 64, SCRYPT_PARAMS, (err, derivedKey) => {
        if (err) {
          console.error('Password verification error:', err);
          resolve(false);
          return;
        }
        
        const derivedKeyHex = derivedKey.toString('hex');
        resolve(derivedKeyHex === hash);
      });
    } catch (error) {
      console.error('Password verification error:', error);
      resolve(false);
    }
  });
};

/**
 * Generate a random salt
 * @param {number} length - Salt length in bytes (default: 32)
 * @returns {string} - Hex encoded salt
 */
const generateSalt = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash sensitive data with salt (for SA ID and account numbers)
 * @param {string} data - Plain text data
 * @param {string} salt - Salt to use
 * @returns {string} - Hashed data
 */
const hashWithSalt = (data, salt) => {
  return crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512').toString('hex');
};

/**
 * Hash South African ID number
 * @param {string} idNumber - Plain text ID number
 * @returns {object} - Object containing hash and salt
 */
const hashIdNumber = (idNumber) => {
  const salt = generateSalt();
  const hash = hashWithSalt(idNumber, salt);
  return { hash, salt };
};

/**
 * Hash account number
 * @param {string} accountNumber - Plain text account number
 * @returns {object} - Object containing hash and salt
 */
const hashAccountNumber = (accountNumber) => {
  const salt = generateSalt();
  const hash = hashWithSalt(accountNumber, salt);
  return { hash, salt };
};

/**
 * Verify hashed data
 * @param {string} plainText - Original plain text
 * @param {string} salt - Salt used for hashing
 * @param {string} hash - Hash to verify against
 * @returns {boolean} - True if data matches
 */
const verifyHashedData = (plainText, salt, hash) => {
  const computedHash = hashWithSalt(plainText, salt);
  return computedHash === hash;
};

/**
 * Generate HMAC signature for transaction integrity
 * @param {object} transactionData - Transaction data to sign
 * @param {string} secret - Secret key for HMAC
 * @returns {string} - HMAC signature
 */
const generateHmacSignature = (transactionData, secret) => {
  const dataString = JSON.stringify(transactionData, Object.keys(transactionData).sort((a, b) => a.localeCompare(b)));
  return crypto.createHmac('sha256', secret).update(dataString).digest('hex');
};

/**
 * Verify HMAC signature
 * @param {object} transactionData - Transaction data
 * @param {string} signature - Signature to verify
 * @param {string} secret - Secret key used for signing
 * @returns {boolean} - True if signature is valid
 */
const verifyHmacSignature = (transactionData, signature, secret) => {
  const expectedSignature = generateHmacSignature(transactionData, secret);
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateSalt,
  hashWithSalt,
  hashIdNumber,
  hashAccountNumber,
  verifyHashedData,
  generateHmacSignature,
  verifyHmacSignature
};
