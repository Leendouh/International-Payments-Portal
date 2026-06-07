/**
 * Comprehensive Attack Protection System
 * Implements multi-layered attack detection and prevention
 */

const crypto = require('node:crypto');
const { auditLog } = require('./logger');

// Attack detection configuration
const ATTACK_CONFIG = {
  // IP-based protection
  ipProtection: {
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 1000,
    maxConcurrentConnections: 10,
    suspiciousThreshold: 100, // requests per minute
    blacklistDuration: 24 * 60 * 60 * 1000, // 24 hours
    whitelist: ['127.0.0.1', '::1'], // Localhost
    geoBlocking: {
      enabled: true,
      allowedCountries: ['ZA', 'US', 'GB', 'CA', 'AU'], // South Africa, US, UK, Canada, Australia
      blockedCountries: ['CN', 'RU', 'KP', 'IR'] // China, Russia, North Korea, Iran
    }
  },
  
  // Anomaly detection
  anomalyDetection: {
    enabled: true,
    baselinePeriod: 24 * 60 * 60 * 1000, // 24 hours
    anomalyThreshold: 3.0, // Standard deviations
    patterns: {
      bruteForce: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
      credentialStuffing: { maxAttempts: 20, windowMs: 60 * 60 * 1000 },
      ddos: { maxRequests: 1000, windowMs: 60 * 1000 },
      scanning: { maxUniquePaths: 50, windowMs: 30 * 60 * 1000 },
      injection: { maxSuspiciousPatterns: 10, windowMs: 10 * 60 * 1000 }
    }
  },
  
  // Request validation
  requestValidation: {
    maxRequestSize: '10mb',
    maxHeaderSize: 8192,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    blockedHeaders: ['x-forwarded-for', 'x-real-ip', 'x-originating-ip'],
    suspiciousPatterns: [
      /\.\./,           // Path traversal
      /<script/i,       // XSS
      /union.*select/i, // SQL injection
      /javascript:/i,   // JavaScript protocol
      /data:.*base64/i, // Data URLs
      /cmd\.exe/i,      // Command injection
      /\/etc\/passwd/i  // System file access
    ]
  },
  
  // Session protection
  sessionProtection: {
    maxSessionsPerIP: 5,
    maxSessionsPerUser: 3,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    suspiciousActivity: {
      concurrentLogins: true,
      rapidSessionCreation: { maxSessions: 3, windowMs: 60 * 1000 },
      impossibleTravel: { maxSpeed: 1000 } // km/h
    }
  }
};

// In-memory storage for attack detection (use Redis in production)
const ipData = new Map();
const attackPatterns = new Map();
const suspiciousIPs = new Map();
const geoIPCache = new Map();

/**
 * Initialize attack protection system
 */
const initializeAttackProtection = () => {
  // Clean up old data periodically
  setInterval(() => {
    cleanupOldData();
  }, 60 * 1000); // Every minute
  
  console.log('Attack protection system initialized');
};

/**
 * Clean up old data to prevent memory leaks
 */
const cleanupOldData = () => {
  const now = Date.now();
  const cutoff = now - 24 * 60 * 60 * 1000; // 24 hours ago
  
  // Clean IP data
  for (const [ip, data] of ipData.entries()) {
    if (data.lastSeen < cutoff) {
      ipData.delete(ip);
    }
  }
  
  // Clean suspicious IPs
  for (const [ip, data] of suspiciousIPs.entries()) {
    if (data.until < now) {
      suspiciousIPs.delete(ip);
    }
  }
  
  // Clean attack patterns
  for (const [pattern, data] of attackPatterns.entries()) {
    if (data.lastSeen < cutoff) {
      attackPatterns.delete(pattern);
    }
  }
};

/**
 * Analyze IP address for threats
 */
const analyzeIP = (ip, userAgent, requestPath) => {
  const now = Date.now();
  
  // Initialize IP data if not exists
  if (!ipData.has(ip)) {
    ipData.set(ip, {
      firstSeen: now,
      lastSeen: now,
      requestCount: 0,
      requests: [],
      suspiciousScore: 0,
      blocked: false,
      geoInfo: null
    });
  }
  
  const data = ipData.get(ip);
  data.lastSeen = now;
  data.requestCount++;
  
  // Add request to history
  data.requests.push({
    timestamp: now,
    path: requestPath,
    userAgent: userAgent
  });
  
  // Keep only recent requests (last hour)
  const hourAgo = now - 60 * 60 * 1000;
  data.requests = data.requests.filter(req => req.timestamp > hourAgo);
  
  // Check if IP is whitelisted
  if (ATTACK_CONFIG.ipProtection.whitelist.includes(ip)) {
    return { safe: true, reason: 'whitelisted' };
  }
  
  // Check if IP is already blocked
  if (data.blocked || suspiciousIPs.has(ip)) {
    const blockData = suspiciousIPs.get(ip);
    if (blockData && blockData.until > now) {
      return { 
        blocked: true, 
        reason: blockData.reason,
        until: blockData.until 
      };
    }
  }
  
  // Analyze request patterns
  const analysis = analyzeRequestPatterns(data);
  
  // Update suspicious score
  data.suspiciousScore += analysis.score;
  
  // Check for geo-blocking
  const geoAnalysis = analyzeGeoLocation(ip);
  
  // Combine all analyses
  const threats = {
    bruteForce: analysis.bruteForce,
    credentialStuffing: analysis.credentialStuffing,
    ddos: analysis.ddos,
    scanning: analysis.scanning,
    injection: analysis.injection,
    geoThreat: geoAnalysis.threat,
    suspiciousScore: data.suspiciousScore
  };
  
  // Block if suspicious score is too high
  if (data.suspiciousScore > 100) {
    blockIP(ip, 'High suspicious activity score', 24 * 60 * 60 * 1000);
    return { blocked: true, reason: 'High suspicious activity score', threats };
  }
  
  return { safe: true, threats, suspiciousScore: data.suspiciousScore };
};

/**
 * Analyze request patterns for attacks
 */
const analyzeRequestPatterns = (ipData) => {
  const now = Date.now();
  const patterns = ATTACK_CONFIG.anomalyDetection.patterns;
  let score = 0;
  const detected = {};
  
  // Check for brute force (many failed logins)
  const recentFailures = ipData.requests.filter(req => 
    req.path.includes('/login') && 
    now - req.timestamp < patterns.bruteForce.windowMs
  );
  
  if (recentFailures.length >= patterns.bruteForce.maxAttempts) {
    detected.bruteForce = true;
    score += 50;
  }
  
  // Check for credential stuffing (many different accounts)
  const uniqueAccounts = new Set();
  recentFailures.forEach(req => {
    // Extract account info from request (simplified)
    const accountMatch = req.path.match(/account=([^&]+)/);
    if (accountMatch) {
      uniqueAccounts.add(accountMatch[1]);
    }
  });
  
  if (uniqueAccounts.size >= patterns.credentialStuffing.maxAttempts) {
    detected.credentialStuffing = true;
    score += 40;
  }
  
  // Check for DDoS (high request rate)
  const recentRequests = ipData.requests.filter(req => 
    now - req.timestamp < patterns.ddos.windowMs
  );
  
  if (recentRequests.length >= patterns.ddos.maxRequests) {
    detected.ddos = true;
    score += 60;
  }
  
  // Check for scanning (many different paths)
  const uniquePaths = new Set(recentRequests.map(req => req.path));
  if (uniquePaths.size >= patterns.scanning.maxUniquePaths) {
    detected.scanning = true;
    score += 30;
  }
  
  // Check for injection attempts
  const suspiciousRequests = recentRequests.filter(req => {
    return ATTACK_CONFIG.requestValidation.suspiciousPatterns.some(pattern => 
      pattern.test(req.path + req.userAgent)
    );
  });
  
  if (suspiciousRequests.length >= patterns.injection.maxSuspiciousPatterns) {
    detected.injection = true;
    score += 70;
  }
  
  return { score, detected };
};

/**
 * Analyze geolocation for threats
 */
const analyzeGeoLocation = (ip) => {
  // Simplified geo-location check (use proper GeoIP service in production)
  const geoInfo = getGeoInfo(ip);
  
  if (!geoInfo) {
    return { threat: false, reason: 'Unknown location' };
  }
  
  const { country } = geoInfo;
  const config = ATTACK_CONFIG.ipProtection.geoBlocking;
  
  if (config.enabled) {
    // Check if country is blocked
    if (config.blockedCountries.includes(country)) {
      return { threat: true, reason: 'Blocked country', country };
    }
    
    // Check if country is not in allowed list
    if (config.allowedCountries.length > 0 && !config.allowedCountries.includes(country)) {
      return { threat: true, reason: 'Country not allowed', country };
    }
  }
  
  return { threat: false, country };
};

/**
 * Get geolocation information (simplified)
 */
const getGeoInfo = (ip) => {
  // In production, use proper GeoIP service like MaxMind
  if (geoIPCache.has(ip)) {
    return geoIPCache.get(ip);
  }
  
  // Simplified logic for demo
  let country = 'Unknown';
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    country = 'Local';
  } else if (ip.startsWith('41.')) {
    country = 'ZA'; // South Africa
  } else if (ip.startsWith('8.')) {
    country = 'US'; // US
  }
  
  const geoInfo = { country, ip };
  geoIPCache.set(ip, geoInfo);
  
  return geoInfo;
};

/**
 * Block IP address
 */
const blockIP = (ip, reason, duration = 24 * 60 * 60 * 1000) => {
  const until = Date.now() + duration;
  
  suspiciousIPs.set(ip, {
    reason,
    until,
    blockedAt: Date.now()
  });
  
  // Update IP data
  if (ipData.has(ip)) {
    const data = ipData.get(ip);
    data.blocked = true;
  }
  
  auditLog('IP_BLOCKED', null, ip, null, {
    reason,
    until: new Date(until).toISOString(),
    duration
  });
  
  console.log(`IP ${ip} blocked: ${reason}`);
};

/**
 * Unblock IP address
 */
const unblockIP = (ip) => {
  suspiciousIPs.delete(ip);
  
  if (ipData.has(ip)) {
    const data = ipData.get(ip);
    data.blocked = false;
    data.suspiciousScore = Math.max(0, data.suspiciousScore - 50);
  }
  
  auditLog('IP_UNBLOCKED', null, ip, null, {});
  console.log(`IP ${ip} unblocked`);
};

/**
 * Check request for attacks
 */
const checkRequest = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || '';
  const requestPath = req.path;
  
  // Skip for health checks and static files
  if (requestPath === '/health' || requestPath.startsWith('/static')) {
    return next();
  }
  
  // Analyze IP
  const analysis = analyzeIP(ip, userAgent, requestPath);
  
  // Block if necessary
  if (analysis.blocked) {
    auditLog('REQUEST_BLOCKED', null, ip, userAgent, {
      reason: analysis.reason,
      path: requestPath,
      threats: analysis.threats
    });
    
    return res.status(429).json({
      error: 'Access denied',
      code: 'IP_BLOCKED',
      reason: analysis.reason,
      retryAfter: analysis.until ? Math.ceil((analysis.until - Date.now()) / 1000) : undefined
    });
  }
  
  // Check request validation
  const validation = validateRequest(req);
  if (!validation.valid) {
    auditLog('INVALID_REQUEST', null, ip, userAgent, {
      reason: validation.reason,
      path: requestPath
    });
    
    return res.status(400).json({
      error: 'Invalid request',
      code: 'INVALID_REQUEST',
      reason: validation.reason
    });
  }
  
  // Add security headers
  addSecurityHeaders(res, req);
  
  // Log suspicious activity
  if (analysis.threats && Object.keys(analysis.threats).length > 0) {
    auditLog('SUSPICIOUS_ACTIVITY', null, ip, userAgent, {
      threats: analysis.threats,
      path: requestPath,
      suspiciousScore: analysis.suspiciousScore
    });
  }
  
  next();
};

/**
 * Validate request for attacks
 */
const validateRequest = (req) => {
  const config = ATTACK_CONFIG.requestValidation;
  
  // Check method
  if (!config.allowedMethods.includes(req.method)) {
    return { valid: false, reason: 'Method not allowed' };
  }
  
  // Check request size
  const contentLength = req.get('Content-Length');
  if (contentLength && Number.parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
    return { valid: false, reason: 'Request too large' };
  }
  
  // Check for suspicious patterns in URL
  const url = req.url;
  for (const pattern of config.suspiciousPatterns) {
    if (pattern.test(url)) {
      return { valid: false, reason: 'Suspicious pattern detected' };
    }
  }
  
  // Check headers for suspicious content
  for (const [header, value] of Object.entries(req.headers)) {
    if (config.blockedHeaders.includes(header.toLowerCase())) {
      return { valid: false, reason: 'Blocked header detected' };
    }
    
    for (const pattern of config.suspiciousPatterns) {
      if (pattern.test(value)) {
        return { valid: false, reason: 'Suspicious header content' };
      }
    }
  }
  
  return { valid: true };
};

/**
 * Add security headers
 */
const addSecurityHeaders = (res, req) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'"
  );
  
  // HSTS (if HTTPS)
  if (req?.protocol === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
};

/**
 * Session anomaly detection
 */
const detectSessionAnomalies = (userId, sessionId, ip, userAgent) => {
  const now = Date.now();
  
  // Check for concurrent sessions
  const userSessions = getUserSessions(userId);
  if (userSessions.length > ATTACK_CONFIG.sessionProtection.maxSessionsPerUser) {
    return {
      anomaly: true,
      type: 'concurrent_sessions',
      message: 'Too many concurrent sessions'
    };
  }
  
  // Check for rapid session creation
  const recentSessions = userSessions.filter(session => 
    now - session.createdAt < ATTACK_CONFIG.sessionProtection.suspiciousActivity.rapidSessionCreation.windowMs
  );
  
  if (recentSessions.length >= ATTACK_CONFIG.sessionProtection.suspiciousActivity.rapidSessionCreation.maxSessions) {
    return {
      anomaly: true,
      type: 'rapid_session_creation',
      message: 'Rapid session creation detected'
    };
  }
  
  // Check for impossible travel (simplified)
  const lastSession = userSessions[userSessions.length - 2];
  if (lastSession && lastSession.ip !== ip) {
    const distance = calculateDistance(lastSession.ip, ip);
    const timeDiff = (now - lastSession.lastSeen) / (1000 * 60 * 60); // hours
    
    if (distance > 0 && timeDiff > 0) {
      const speed = distance / timeDiff; // km/h
      
      if (speed > ATTACK_CONFIG.sessionProtection.suspiciousActivity.impossibleTravel.maxSpeed) {
        return {
          anomaly: true,
          type: 'impossible_travel',
          message: 'Impossible travel detected',
          speed,
          distance,
          timeDiff
        };
      }
    }
  }
  
  return { anomaly: false };
};

/**
 * Get user sessions (simplified)
 */
const getUserSessions = (userId) => {
  // In production, use database or Redis
  return [];
};

/**
 * Calculate distance between IPs (simplified)
 */
const calculateDistance = (ip1, ip2) => {
  // In production, use proper geo-location distance calculation
  return Math.random() * 1000; // Random distance for demo
};

/**
 * Get attack statistics
 */
const getAttackStatistics = () => {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  
  let totalRequests = 0;
  let blockedRequests = 0;
  let suspiciousIPs = 0;

  for (const [, data] of ipData.entries()) {
    if (data.lastSeen > dayAgo) {
      totalRequests += data.requestCount;
      if (data.blocked) {
        blockedRequests += data.requestCount;
        suspiciousIPs++;
      }
    }
  }
  
  return {
    totalRequests,
    blockedRequests,
    suspiciousIPs,
    blockedIPs: suspiciousIPs.size,
    attackPatterns: Array.from(attackPatterns.entries()).map(([pattern, data]) => ({
      pattern,
      count: data.count,
      lastSeen: data.lastSeen
    }))
  };
};

/**
 * Attack protection middleware
 */
const attackProtection = (options = {}) => {
  return (req, res, next) => {
    checkRequest(req, res, next);
  };
};

module.exports = {
  ATTACK_CONFIG,
  initializeAttackProtection,
  analyzeIP,
  blockIP,
  unblockIP,
  checkRequest,
  validateRequest,
  detectSessionAnomalies,
  getAttackStatistics,
  attackProtection
};
