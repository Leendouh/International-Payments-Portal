/**
 * Secure Lockout Notification System
 * Provides user-friendly lockout information without compromising security
 */

const crypto = require('node:crypto');
const { auditLog } = require('./logger');

/**
 * Generate secure lockout notification with countdown
 */
const generateLockoutNotification = (lockoutInfo, requestContext) => {
  const { lockoutUntil, reason, attempts, maxAttempts, isIPLockout } = lockoutInfo;
  const now = Date.now();
  const remainingTime = Math.max(0, lockoutUntil - now);
  
  // Calculate human-readable time remaining
  const timeRemaining = formatTimeRemaining(remainingTime);
  
  // Generate secure notification ID for tracking
  const notificationId = crypto.randomUUID();
  
  // Create secure notification (no sensitive internal data exposed)
  const notification = {
    notificationId,
    type: isIPLockout ? 'ip_lockout' : 'account_lockout',
    status: 'locked',
    lockedAt: new Date(now).toISOString(),
    unlockAt: new Date(lockoutUntil).toISOString(),
    timeRemaining,
    attempts,
    maxAttempts,
    message: generateUserMessage(reason, timeRemaining, isIPLockout),
    securityInfo: {
      lockoutReason: getPublicReason(reason),
      securityMeasures: 'For your protection, this account has been temporarily locked',
      nextAttempt: new Date(lockoutUntil).toLocaleString()
    },
    support: {
      canContactSupport: remainingTime > 30 * 60 * 1000, // Only show support option after 30 minutes
      supportMessage: 'If this is an error, please contact our support team'
    }
  };
  
  // Log the notification for audit purposes
  auditLog('LOCKOUT_NOTIFICATION_GENERATED', requestContext.userId, requestContext.ip, requestContext.userAgent, {
    notificationId,
    lockoutType: notification.type,
    timeRemaining,
    attempts
  });
  
  return notification;
};

/**
 * Format remaining time in human-readable format
 */
const formatTimeRemaining = (milliseconds) => {
  if (milliseconds <= 0) return 'now';

  const totalMinutes = Math.ceil(milliseconds / (1000 * 60));

  if (totalMinutes < 1) {
    return 'less than 1 minute';
  }

  if (totalMinutes < 60) {
    return formatMinutes(totalMinutes);
  }

  return formatHoursAndMinutes(totalMinutes);
};

/**
 * Format minutes with proper pluralization
 */
const formatMinutes = (minutes) => {
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
};

/**
 * Format hours and minutes with proper pluralization
 */
const formatHoursAndMinutes = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }

  return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
};

/**
 * Generate user-friendly message based on lockout reason
 */
const generateUserMessage = (reason, timeRemaining, isIPLockout) => {
  if (isIPLockout) {
    return `For security reasons, access from this location has been temporarily blocked. You can try again in ${timeRemaining}.`;
  }
  
  switch (reason) {
    case 'Too many failed login attempts':
      return `Too many incorrect login attempts. For your security, this account has been temporarily locked. You can try again in ${timeRemaining}.`;
    
    case 'Too many failed attempts from this IP address':
      return `Multiple failed attempts detected from this location. Access has been temporarily blocked. Please try again in ${timeRemaining}.`;
    
    default:
      return `For your security, this account has been temporarily locked. You can try again in ${timeRemaining}.`;
  }
};

/**
 * Convert internal reason to public-friendly reason
 */
const getPublicReason = (reason) => {
  const publicReasons = {
    'Too many failed login attempts': 'Multiple incorrect login attempts',
    'Too many failed attempts from this IP address': 'Suspicious activity detected',
    'Security breach detected': 'Security precaution',
    'Password expired (90 days)': 'Routine security update required'
  };
  
  return publicReasons[reason] || 'Security precaution';
};

/**
 * Create countdown timer response
 */
const createCountdownResponse = (lockoutInfo, requestContext) => {
  const notification = generateLockoutNotification(lockoutInfo, requestContext);
  
  return {
    error: notification.message,
    code: lockoutInfo.isIPLockout ? 'IP_LOCKED' : 'ACCOUNT_LOCKED',
    lockedUntil: notification.unlockAt,
    timeRemaining: notification.timeRemaining,
    countdown: {
      enabled: true,
      refreshInterval: 60000, // Refresh every minute
      unlockTime: notification.unlockAt,
      currentTime: new Date().toISOString()
    },
    security: {
      lockoutReason: notification.securityInfo.lockoutReason,
      attempts: notification.attempts,
      maxAttempts: notification.maxAttempts
    },
    support: notification.support,
    notificationId: notification.notificationId
  };
};

/**
 * Check if countdown should be updated (to prevent timing attacks)
 */
const shouldUpdateCountdown = (lastRequestTime, currentTime) => {
  // Only allow countdown updates every 30 seconds minimum
  const minInterval = 30 * 1000;
  return (currentTime - lastRequestTime) >= minInterval;
};

/**
 * Generate progressive delay message
 */
const generateProgressiveDelayMessage = (delayMs, attemptNumber) => {
  const delaySeconds = Math.ceil(delayMs / 1000);
  
  if (delaySeconds <= 5) {
    return `Please wait ${delaySeconds} seconds before trying again.`;
  } else if (delaySeconds <= 30) {
    return `For security, please wait ${delaySeconds} seconds before your next attempt.`;
  } else {
    const minutes = Math.ceil(delaySeconds / 60);
    return `To protect your account, please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`;
  }
};

/**
 * Create lockout status API response
 */
const createLockoutStatusResponse = (email, ip, requestContext) => {
  const { isAccountLocked, isIPLocked } = require('./accountLockout');
  
  const accountStatus = isAccountLocked(email);
  const ipStatus = isIPLocked(ip);
  
  const response = {
    timestamp: new Date().toISOString(),
    account: {
      isLocked: accountStatus.locked,
      ...(accountStatus.locked && {
        lockoutInfo: createCountdownResponse(
          { 
            lockoutUntil: accountStatus.lockoutUntil, 
            reason: 'Too many failed login attempts',
            isIPLockout: false 
          },
          requestContext
        )
      })
    },
    ip: {
      isLocked: ipStatus.locked,
      ...(ipStatus.locked && {
        lockoutInfo: createCountdownResponse(
          { 
            lockoutUntil: ipStatus.lockoutUntil, 
            reason: 'Too many failed attempts from this IP address',
            isIPLockout: true 
          },
          requestContext
        )
      })
    },
    security: {
      message: 'Account security is active',
      protectionLevel: accountStatus.locked || ipStatus.locked ? 'high' : 'normal'
    }
  };
  
  return response;
};

/**
 * Generate lockout warning (before actual lockout)
 */
const generateLockoutWarning = (attempts, maxAttempts, requestContext) => {
  const remainingAttempts = maxAttempts - attempts;
  
  return {
    warning: true,
    message: `Security warning: You have ${remainingAttempts} login attempt${remainingAttempts > 1 ? 's' : ''} remaining before account lockout.`,
    attempts,
    maxAttempts,
    remainingAttempts,
    security: {
      level: remainingAttempts <= 2 ? 'high' : 'medium',
      recommendation: remainingAttempts <= 2 ? 
        'Please verify your credentials carefully' : 
        'Ensure you are using the correct login information'
    }
  };
};

/**
 * Create secure email notification template
 */
const createEmailNotification = (lockoutInfo, userEmail) => {
  const { lockoutUntil, reason, attempts } = lockoutInfo;
  const timeRemaining = formatTimeRemaining(lockoutUntil - Date.now());
  
  return {
    to: userEmail,
    subject: 'Account Security Alert - Temporary Lockout',
    template: 'lockout_notification',
    data: {
      lockoutTime: new Date(lockoutUntil).toLocaleString(),
      timeRemaining,
      attempts,
      reason: getPublicReason(reason),
      securityMessage: 'This lockout protects your account from unauthorized access',
      supportInfo: 'If you did not attempt to login, please contact support immediately'
    }
  };
};

module.exports = {
  generateLockoutNotification,
  createCountdownResponse,
  formatTimeRemaining,
  generateUserMessage,
  getPublicReason,
  shouldUpdateCountdown,
  generateProgressiveDelayMessage,
  createLockoutStatusResponse,
  generateLockoutWarning,
  createEmailNotification
};
