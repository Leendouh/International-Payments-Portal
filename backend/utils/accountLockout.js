/**
 * Account Lockout Mechanism
 * Implements comprehensive account lockout for brute force protection
 */

const crypto = require('node:crypto');

// Lockout configuration
const LOCKOUT_CONFIG = {
  maxAttempts: 5,           // Maximum failed attempts before lockout
  lockoutDuration: 15 * 60 * 1000,  // 15 minutes in milliseconds
  progressiveDelay: true,   // Enable progressive delay
  baseDelay: 30 * 1000,     // 30 seconds base delay
  maxDelay: 5 * 60 * 1000,  // 5 minutes maximum delay
  resetAfterSuccess: true,  // Reset attempts on successful login
  trackIP: true,            // Track failed attempts by IP
  ipThreshold: 10,          // Max attempts per IP before IP lockout
  ipLockoutDuration: 30 * 60 * 1000  // 30 minutes IP lockout
};

// In-memory storage for failed attempts (in production, use Redis or database)
const failedAttempts = new Map();
const ipAttempts = new Map();
const lockedAccounts = new Map();
const lockedIPs = new Map();

/**
 * Record a failed login attempt
 */
const recordFailedAttempt = (email, ip = null) => {
  const now = Date.now();
  const key = email.toLowerCase();
  
  // Record account-level failed attempts
  if (!failedAttempts.has(key)) {
    failedAttempts.set(key, []);
  }
  
  const accountAttempts = failedAttempts.get(key);
  accountAttempts.push(now);
  
  // Clean old attempts (older than lockout duration)
  const cutoff = now - LOCKOUT_CONFIG.lockoutDuration;
  const recentAttempts = accountAttempts.filter(time => time > cutoff);
  failedAttempts.set(key, recentAttempts);
  
  // Check if account should be locked
  if (recentAttempts.length >= LOCKOUT_CONFIG.maxAttempts) {
    const lockoutUntil = now + LOCKOUT_CONFIG.lockoutDuration;
    lockedAccounts.set(key, lockoutUntil);
    
    return {
      locked: true,
      lockoutUntil,
      attempts: recentAttempts.length,
      reason: 'Too many failed login attempts'
    };
  }
  
  // Track IP-level attempts if enabled
  if (LOCKOUT_CONFIG.trackIP && ip) {
    if (!ipAttempts.has(ip)) {
      ipAttempts.set(ip, []);
    }
    
    const ipAttemptList = ipAttempts.get(ip);
    ipAttemptList.push(now);
    
    // Clean old IP attempts
    const recentIPAttempts = ipAttemptList.filter(time => time > cutoff);
    ipAttempts.set(ip, recentIPAttempts);
    
    // Check if IP should be locked
    if (recentIPAttempts.length >= LOCKOUT_CONFIG.ipThreshold) {
      const ipLockoutUntil = now + LOCKOUT_CONFIG.ipLockoutDuration;
      lockedIPs.set(ip, ipLockoutUntil);
      
      return {
        locked: true,
        lockoutUntil: ipLockoutUntil,
        attempts: recentIPAttempts.length,
        reason: 'Too many failed attempts from this IP address',
        isIPLockout: true
      };
    }
  }
  
  return {
    locked: false,
    attempts: recentAttempts.length,
    remainingAttempts: LOCKOUT_CONFIG.maxAttempts - recentAttempts.length
  };
};

/**
 * Check if an account is currently locked
 */
const isAccountLocked = (email) => {
  const key = email.toLowerCase();
  const lockoutUntil = lockedAccounts.get(key);
  
  if (!lockoutUntil) {
    return { locked: false };
  }
  
  const now = Date.now();
  if (now > lockoutUntil) {
    // Lockout expired, clean up
    lockedAccounts.delete(key);
    failedAttempts.delete(key);
    return { locked: false };
  }
  
  return {
    locked: true,
    lockoutUntil,
    remainingTime: Math.ceil((lockoutUntil - now) / 1000 / 60) // minutes
  };
};

/**
 * Check if an IP is currently locked
 */
const isIPLocked = (ip) => {
  const lockoutUntil = lockedIPs.get(ip);
  
  if (!lockoutUntil) {
    return { locked: false };
  }
  
  const now = Date.now();
  if (now > lockoutUntil) {
    // Lockout expired, clean up
    lockedIPs.delete(ip);
    ipAttempts.delete(ip);
    return { locked: false };
  }
  
  return {
    locked: true,
    lockoutUntil,
    remainingTime: Math.ceil((lockoutUntil - now) / 1000 / 60) // minutes
  };
};

/**
 * Clear failed attempts after successful login
 */
const clearFailedAttempts = (email, ip = null) => {
  if (LOCKOUT_CONFIG.resetAfterSuccess) {
    const key = email.toLowerCase();
    failedAttempts.delete(key);
    lockedAccounts.delete(key);
    
    // Also clear IP attempts for this successful login
    if (ip && ipAttempts.has(ip)) {
      const ipAttemptList = ipAttempts.get(ip);
      // Remove this specific successful attempt from IP tracking
      const filteredAttempts = ipAttemptList.filter(time => {
        // Keep attempts that are not associated with this email's recent failures
        return Date.now() - time > LOCKOUT_CONFIG.lockoutDuration;
      });
      
      if (filteredAttempts.length === 0) {
        ipAttempts.delete(ip);
        lockedIPs.delete(ip);
      } else {
        ipAttempts.set(ip, filteredAttempts);
      }
    }
  }
};

/**
 * Calculate progressive delay for failed attempts
 */
const calculateProgressiveDelay = (attempts) => {
  if (!LOCKOUT_CONFIG.progressiveDelay) {
    return 0;
  }
  
  // Exponential backoff with jitter
  const delay = Math.min(
    LOCKOUT_CONFIG.baseDelay * Math.pow(2, attempts - 1),
    LOCKOUT_CONFIG.maxDelay
  );
  
  // Add random jitter to prevent timing attacks
  const jitter = crypto.randomInt(0, delay * 0.1);
  
  return delay + jitter;
};

/**
 * Get comprehensive lockout status
 */
const getLockoutStatus = (email, ip = null) => {
  const accountStatus = isAccountLocked(email);
  const ipStatus = ip ? isIPLocked(ip) : { locked: false };
  
  const key = email.toLowerCase();
  const attempts = failedAttempts.get(key) || [];
  const recentAttempts = attempts.filter(time => 
    Date.now() - time < LOCKOUT_CONFIG.lockoutDuration
  );
  
  return {
    account: accountStatus,
    ip: ipStatus,
    attempts: recentAttempts.length,
    maxAttempts: LOCKOUT_CONFIG.maxAttempts,
    remainingAttempts: Math.max(0, LOCKOUT_CONFIG.maxAttempts - recentAttempts.length),
    progressiveDelay: calculateProgressiveDelay(recentAttempts.length)
  };
};

/**
 * Generate lockout notification
 */
const generateLockoutNotification = (email, lockInfo, ip = null) => {
  const timestamp = new Date().toISOString();
  
  return {
    timestamp,
    email,
    ip,
    lockoutReason: lockInfo.reason,
    lockoutUntil: new Date(lockInfo.lockoutUntil).toISOString(),
    duration: Math.ceil((lockInfo.lockoutUntil - Date.now()) / 1000 / 60),
    severity: lockInfo.isIPLockout ? 'high' : 'medium',
    notificationId: crypto.randomUUID()
  };
};

/**
 * Clean up expired lockouts (should be called periodically)
 */
const cleanupExpiredLockouts = () => {
  const now = Date.now();
  let cleanedAccounts = 0;
  let cleanedIPs = 0;
  
  // Clean expired account lockouts
  for (const [email, lockoutUntil] of lockedAccounts.entries()) {
    if (now > lockoutUntil) {
      lockedAccounts.delete(email);
      failedAttempts.delete(email);
      cleanedAccounts++;
    }
  }
  
  // Clean expired IP lockouts
  for (const [ip, lockoutUntil] of lockedIPs.entries()) {
    if (now > lockoutUntil) {
      lockedIPs.delete(ip);
      ipAttempts.delete(ip);
      cleanedIPs++;
    }
  }
  
  return {
    cleanedAccounts,
    cleanedIPs,
    totalActiveAccountLockouts: lockedAccounts.size,
    totalActiveIPLockouts: lockedIPs.size
  };
};

/**
 * Get lockout statistics for monitoring
 */
const getLockoutStatistics = () => {
  return {
    activeAccountLockouts: lockedAccounts.size,
    activeIPLockouts: lockedIPs.size,
    trackedAccounts: failedAttempts.size,
    trackedIPs: ipAttempts.size,
    config: LOCKOUT_CONFIG
  };
};

module.exports = {
  LOCKOUT_CONFIG,
  recordFailedAttempt,
  isAccountLocked,
  isIPLocked,
  clearFailedAttempts,
  calculateProgressiveDelay,
  getLockoutStatus,
  generateLockoutNotification,
  cleanupExpiredLockouts,
  getLockoutStatistics
};
