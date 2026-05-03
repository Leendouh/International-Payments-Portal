# International Payments Portal

A secure customer-facing international payments portal built with React and Node.js, implementing comprehensive security controls as specified in Task 1 requirements.

## 🛡️ Security Features Implemented

### Authentication & Authorization
- **Password Security**: bcrypt hashing with cost factor 12
- **Session Management**: Secure HTTP-only, SameSite=strict cookies
- **CSRF Protection**: Per-session CSRF tokens for state-changing requests
- **Session Jacking Prevention**: IP binding, session rotation, timeouts

### Input Validation
- **Whitelist Validation**: RegEx patterns for all input fields
- **SQL Injection Prevention**: Parameterized queries only
- **XSS Protection**: Output encoding and strict CSP headers
- **SA ID Validation**: Luhn algorithm implementation

### Transport Security
- **HTTPS Only**: All traffic served over SSL/TLS
- **HSTS Headers**: Strict Transport Security enforcement
- **TLS Configuration**: Modern cipher suites, TLS 1.2+ only

### Attack Mitigation
- **Rate Limiting**: Configurable limits per endpoint
- **Clickjacking Protection**: X-Frame-Options and CSP frame-ancestors
- **DDoS Protection**: Request rate limiting and connection limits
- **Audit Logging**: Comprehensive logging of all security events

### Data Protection
- **Sensitive Data Hashing**: Salted hashes for ID numbers and accounts
- **Transaction Integrity**: HMAC-SHA256 signatures
- **Database Security**: Least privilege access, parameterized queries

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- OpenSSL (for certificate generation - included in backend)

## 🚀 Quick Start

### 1. Database Setup

```bash
# Navigate to backend directory
cd backend

# Create the database (using your postgres user)
psql -U postgres -c "CREATE DATABASE international_payments;"

# Run the schema to create tables
psql -U postgres -d international_payments -f db/init.sql
```

**Or use pgAdmin:**
1. Connect to PostgreSQL server
2. Create database: `international_payments`
3. Run the `db/init.sql` script to create all tables

**Expected Result:**
- Database `international_payments` created
- All tables and indexes created
- Database ready for application use

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

**Expected Output:**
```
added 470 packages, and audited 471 packages in Xs
✨ Done in Xs
```

```bash
# Generate SSL certificates (already done, but for reference)
node generate-certs.js
```

**Note:** The `.env` file has already been created with the correct database credentials. You can modify it if needed.

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

**Expected Output:**
```
added 188 packages, and audited 188 packages in Xs
✨ Done in Xs
```

### 4. Start the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
npm start
```

**Expected Backend Output:**
```
Database connected successfully: 2024-XX-XX XX:XX:XX.XXX+00
🔒 Secure International Payments Portal API running on https://localhost:8443
📚 API documentation available at https://localhost:8443/api
🏥 Health check at https://localhost:8443/health
🔧 Environment: development
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```

**Expected Frontend Output:**
```
  VITE v4.1.0  ready in XXX ms

  ➜  Network: https://localhost:3000
  ➜  Network: https://192.168.X.X:3000
  ➜  press h to show help
```

### 5. Access the Application

- **Frontend**: https://localhost:3000
- **API Documentation**: https://localhost:8443/api
- **Health Check**: https://localhost:8443/health

**Important Notes:**
- You will see browser warnings about self-signed certificates - this is expected
- Click "Advanced" → "Proceed to localhost (unsafe)" to continue
- Both frontend and backend must be running for the application to work

## 🔄 What Happens When You Run the Application

### Backend Startup Process:
1. **Database Connection**: Connects to PostgreSQL and verifies schema
2. **SSL Certificate Loading**: Loads self-signed certificates for HTTPS
3. **Security Middleware**: Initializes all security headers and rate limiters
4. **API Routes**: Sets up authentication and payment endpoints
5. **Server Listening**: Starts HTTPS server on port 8443

### Frontend Startup Process:
1. **Vite Dev Server**: Starts development server with HTTPS
2. **React App**: Loads the main application with authentication context
3. **API Proxy**: Configures proxy to backend at https://localhost:8443
4. **Hot Reload**: Enables live reloading during development

### Application Flow:
1. **Initial Load**: Shows login/register page
2. **User Registration**: Creates account with hashed credentials
3. **User Login**: Authenticates and creates secure session
4. **Dashboard**: Shows payment options and security features
5. **Payment Creation**: Validates input, signs with HMAC, stores transaction
6. **Payment History**: Displays paginated transaction history

## 🧪 Testing the Application

### Test User Registration:
1. Navigate to https://localhost:3000/register
2. Fill in the form with valid data:
   - Full Name: "John Doe"
   - SA ID: "9001015009087" (valid Luhn check)
   - Account Number: "12345678"
   - Email: "test@example.com"
   - Password: "SecurePass123!"
3. Click "Create Account"
4. **Expected**: Redirect to dashboard with success message

### Test User Login:
1. Navigate to https://localhost:3000/login
2. Enter credentials from registration
3. Click "Login"
4. **Expected**: Redirect to dashboard with welcome message

### Test Payment Creation:
1. From dashboard, click "Create Payment"
2. Fill in payment details:
   - Amount: "1000.00"
   - Currency: "ZAR"
   - SWIFT/BIC: "ABCDZAJJXXX"
   - Recipient Account: "9876543210987654"
3. Click "Initiate Payment"
4. **Expected**: Success message and redirect to payment history

### Test Security Features:
1. **SQL Injection**: Try `' OR '1'='1` in email field → Should be rejected
2. **XSS**: Try `<script>alert('XSS')</script>` in name field → Should be escaped
3. **Rate Limiting**: Send 101 rapid login requests → Should get 429 error
4. **CSRF**: Use Postman without CSRF token → Should get 403 error

## 📁 Project Structure

```
international-payments-portal/
├── backend/                    # Node.js API server
│   ├── db/
│   │   └── init.sql           # Database schema
│   ├── middleware/            # Security middleware
│   │   ├── auth.js           # Authentication middleware
│   │   ├── csrf.js           # CSRF protection
│   │   ├── inputValidation.js # Input validation
│   │   ├── rateLimiter.js    # Rate limiting
│   │   └── securityHeaders.js # Security headers
│   ├── routes/               # API routes
│   │   ├── auth.js           # Authentication endpoints
│   │   └── payments.js       # Payment endpoints
│   ├── utils/                # Utility functions
│   │   ├── database.js       # Database connection
│   │   ├── hash.js           # Hashing utilities
│   │   └── logger.js         # Audit logging
│   ├── server.js             # Main server file
│   └── package.json
├── frontend/                  # React application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── LoginForm.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── PaymentForm.jsx
│   │   │   ├── PaymentHistory.jsx
│   │   │   └── RegistrationForm.jsx
│   │   ├── hooks/            # Custom React hooks
│   │   │   └── useAuth.js
│   │   ├── services/         # API services
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   └── package.json
├── certs/                     # SSL certificates
│   ├── key.pem
│   └── cert.pem
└── README.md
```

## 🔧 Development

### Database Schema

The application uses the following main tables:
- `customers` - User accounts with hashed sensitive data
- `transactions` - Payment records with HMAC signatures
- `user_sessions` - Secure session management
- `audit_log` - Comprehensive audit trail

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/csrf-token` - Get CSRF token

#### Payments
- `POST /api/payments` - Create payment
- `GET /api/payments` - Get payment history
- `GET /api/payments/:id` - Get payment details
- `GET /api/payments/currencies/list` - Get supported currencies
- `GET /api/payments/providers/list` - Get supported providers

### Security Testing

The application includes security controls against:
- **SQL Injection**: Try `' OR '1'='1` in any input field
- **XSS**: Try `<script>alert('XSS')</script>` in name fields
- **CSRF**: Send requests without CSRF token header
- **Rate Limiting**: Send >100 login requests per minute
- **Session Jacking**: Copy session cookies to different browser
- **Clickjacking**: Try to iframe the application
- **MITM**: Access via HTTP (should redirect to HTTPS)

## 📝 Testing Security Controls

### Manual Testing Steps

1. **SQL Injection Test**:
   - Enter `' OR '1'='1` in login email field
   - Expected: Validation error, no database compromise

2. **XSS Test**:
   - Enter `<script>alert('XSS')</script>` in full name field
   - Expected: Input rejected or safely escaped

3. **CSRF Test**:
   - Use curl/postman without CSRF token
   - Expected: 403 Forbidden response

4. **Rate Limiting Test**:
   - Send 101 login requests within 1 minute
   - Expected: HTTP 429 Too Many Requests

5. **Session Security Test**:
   - Login, copy session cookie, use in incognito
   - Expected: Session invalid or IP mismatch logged

## 🔒 Security Configuration

### Security Headers
- Content Security Policy (CSP)
- Strict Transport Security (HSTS)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer Policy: strict-origin-when-cross-origin

### Rate Limits
- General: 1000 requests/15min/IP
- Authentication: 100 requests/min/IP
- Registration: 10 requests/hour/IP
- Payments: 50 requests/min/IP

### Password Requirements
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character

## 📊 Monitoring & Logging

- **Audit Log**: All security events logged to database and files
- **Error Logging**: Comprehensive error tracking
- **Performance Metrics**: Request timing and response monitoring
- **Security Events**: Failed logins, rate limits, validation failures

## 🚨 Important Notes

- This is a **demonstration portal** for academic purposes
- All payments are created with "pending" status
- Do not use real financial information
- SSL certificates are self-signed (browser warnings expected)
- In production, use certificates from trusted CA

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For issues or questions regarding security implementation, please refer to the Task 1 security architecture report.
