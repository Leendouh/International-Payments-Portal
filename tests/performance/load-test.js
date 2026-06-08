import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics for security testing
const errorRate = new Rate('errors');
const authFailures = new Rate('auth_failures');
const securityViolations = new Rate('security_violations');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Less than 10% failed requests
    errors: ['rate<0.05'],            // Less than 5% errors
    auth_failures: ['rate<0.01'],     // Less than 1% auth failures
  },
};

const BASE_URL = 'https://localhost:8443';

// Test data - passwords from environment variables for security
const users = [
  { email: 'test1@example.com', password: __ENV.TEST_PASSWORD , accountNumber: '1234567890123456' },
  { email: 'test2@example.com', password: __ENV.TEST_PASSWORD , accountNumber: '2345678901234567' },
  { email: 'test3@example.com', password: __ENV.TEST_PASSWORD , accountNumber: '3456789012345678' },
];

export function setup() {
  // Setup test environment
  console.log('Setting up performance test environment...');
  
  // Verify application is ready
  const response = http.get(`${BASE_URL}/health`);
  if (response.status !== 200) {
    throw new Error('Application is not ready for testing');
  }
  
  return { startTime: new Date().toISOString() };
}

export default function(data) {
  // Select random user
  const user = users[Math.floor(Math.random() * users.length)];
  
  // Test 1: Authentication flow
  const authResult = testAuthentication(user);
  
  // Test 2: Protected resource access
  if (authResult.token) {
    testProtectedAccess(authResult.token);
  }
  
  // Test 3: Payment processing
  if (authResult.token && Math.random() > 0.7) {
    testPaymentProcessing(authResult.token, user);
  }
  
  // Test 4: Security endpoints
  testSecurityEndpoints();
  
  sleep(1);
}

function testAuthentication(user) {
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
    accountNumber: user.accountNumber,
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'k6-performance-test',
    },
  };
  
  const response = http.post(`${BASE_URL}/api/auth/login`, loginPayload, params);
  
  const authSuccess = check(response, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 1000ms': (r) => r.timings.duration < 1000,
    'login has token': (r) => r.json('token') !== undefined,
    'login has session cookie': (r) => r.headers['Set-Cookie'] !== undefined,
  });
  
  if (!authSuccess) {
    authFailures.add(1);
  }
  
  errorRate.add(!authSuccess);
  
  return {
    success: authSuccess,
    token: response.json('token'),
    sessionId: response.headers['Set-Cookie']?.split(';')[0]?.split('=')[1],
  };
}

function testProtectedAccess(token) {
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  
  const response = http.get(`${BASE_URL}/api/auth/profile`, params);
  
  const accessSuccess = check(response, {
    'profile status is 200': (r) => r.status === 200,
    'profile response time < 500ms': (r) => r.timings.duration < 500,
    'profile has user data': (r) => r.json('email') !== undefined,
  });
  
  errorRate.add(!accessSuccess);
}

function testPaymentProcessing(token, user) {
  const paymentPayload = JSON.stringify({
    amount: (Math.random() * 1000 + 10).toFixed(2),
    currency: 'USD',
    provider: 'SWIFT',
    swiftBic: 'ABCDUS33XXX',
    recipientAccount: 'GB82WEST12345698765432',
    description: 'Performance test payment',
  });
  
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  
  const response = http.post(`${BASE_URL}/api/payments/process`, paymentPayload, params);
  
  const paymentSuccess = check(response, {
    'payment status is 200 or 400': (r) => r.status === 200 || r.status === 400,
    'payment response time < 2000ms': (r) => r.timings.duration < 2000,
    'payment has proper error handling': (r) => r.status !== 500,
  });
  
  errorRate.add(!paymentSuccess);
}

function testSecurityEndpoints() {
  // Test password strength endpoint - password from environment variable
  const passwordPayload = {
    password: __ENV.TEST_PASSWORD,
    email: 'test@example.com',
  };
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const response = http.get(`${BASE_URL}/api/password-strength?password=${passwordPayload.password}&email=${passwordPayload.email}`, params);
  
  const securitySuccess = check(response, {
    'password strength status is 200': (r) => r.status === 200,
    'password strength response time < 300ms': (r) => r.timings.duration < 300,
    'password strength has validation': (r) => r.json('isValid') !== undefined,
  });
  
  errorRate.add(!securitySuccess);
  
  // Test lockout status endpoint
  const lockoutResponse = http.get(`${BASE_URL}/api/lockout-status?email=test@example.com`, params);
  
  const lockoutSuccess = check(lockoutResponse, {
    'lockout status status is 200': (r) => r.status === 200,
    'lockout status response time < 300ms': (r) => r.timings.duration < 300,
    'lockout status has proper structure': (r) => r.json('account') !== undefined,
  });
  
  errorRate.add(!lockoutSuccess);
}

export function teardown(data) {
  // Cleanup test environment
  console.log('Cleaning up performance test environment...');
  console.log(`Test started at: ${data.startTime}`);
  console.log(`Test completed at: ${new Date().toISOString()}`);
}

// Custom function to test rate limiting
export function testRateLimiting() {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  let rateLimitHit = false;
  
  // Send rapid requests to test rate limiting
  for (let i = 0; i < 20; i++) {
    const response = http.get(`${BASE_URL}/api/auth/profile`, params);
    
    if (response.status === 429) {
      rateLimitHit = true;
      break;
    }
  }
  
  check(rateLimitHit, {
    'rate limiting is working': () => rateLimitHit,
  });
}

// Security-focused load test
export function handleSummary(data) {
  console.log('Performance Test Summary:');
  console.log(`Total requests: ${data.metrics.http_reqs.count}`);
  console.log(`Failed requests: ${data.metrics.http_req_failed.count}`);
  console.log(`Average response time: ${data.metrics.http_req_duration.avg}ms`);
  console.log(`95th percentile: ${data.metrics.http_req_duration['p(95)']}ms`);
  console.log(`Error rate: ${(data.metrics.errors.rate * 100).toFixed(2)}%`);
  console.log(`Auth failure rate: ${(data.metrics.auth_failures.rate * 100).toFixed(2)}%`);
  
  // Check for security issues
  if (data.metrics.auth_failures.rate > 0.01) {
    console.warn('⚠️  High authentication failure rate detected!');
  }
  
  if (data.metrics.errors.rate > 0.05) {
    console.warn('⚠️  High error rate detected!');
  }
  
  if (data.metrics.http_req_duration['p(95)'] > 500) {
    console.warn('⚠️  Slow response times detected!');
  }
}
