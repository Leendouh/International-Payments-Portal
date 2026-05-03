const bcrypt = require('bcrypt');
const crypto = require('crypto');

/**
 * Hashing Utilities
 * Implements secure password hashing and data salting as per Task 1 requirements
 */

const SALT_ROUNDS = 12; // As specified in requirements (≥12)

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Password hashing failed');
  }
};

/**
 * Verify a password against its hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
const verifyPassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
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
  const dataString = JSON.stringify(transactionData, Object.keys(transactionData).sort());
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
