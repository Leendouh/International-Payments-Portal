<div align="center">

# 🌍 International Payments Portal

**A secure, enterprise-grade international payments platform with comprehensive security controls**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://postgresql.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Customer Portal** | **Employee Portal** | **Admin Dashboard**

[![Watch Demo](https://img.shields.io/badge/📺-Watch_Demo-red.svg)](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)

</div>

---

## 📋 Overview

The International Payments Portal is a comprehensive financial platform featuring dual portals for customers and employees, built with enterprise-grade security standards. The system enables secure international money transfers while maintaining strict compliance with security best practices.

### 🎯 Key Features

- **Dual Portal Architecture**: Separate interfaces for customers and employees
- **Role-Based Access Control**: Admin, Manager, and Employee roles
- **Transaction Management**: Create, approve, process, and track international payments
- **Real-time Security**: WebSocket-based notifications and audit logging
- **Comprehensive Security**: 10+ attack protections with DevSecOps pipeline

---

## 🛡️ Security Features

### 🔐 Authentication & Authorization

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | scrypt with random salts (64-byte derived key) |
| **Session Management** | HTTP-only, SameSite=strict cookies |
| **JWT Authentication** | Secure token-based authentication |
| **CSRF Protection** | Per-session CSRF tokens |
| **Account Lockout** | Progressive delays with IP tracking |
| **Rate Limiting** | Multi-tier rate limiting per endpoint |

### 🚦 Attack Protections

<details>
<summary><b>Click to expand protections</b></summary>

1. **SQL Injection** - Parameterized queries with PostgreSQL
2. **XSS** - Helmet.js, CSP headers, input sanitization
3. **CSRF** - Token-based protection with double-submit pattern
4. **DDoS** - Multi-level rate limiting
5. **Brute Force** - Account lockout with countdown timer
6. **Session Hijacking** - Secure cookies, IP binding
7. **MitM** - HTTPS/TLS with strong ciphers
8. **Input Validation** - RegEx whitelisting for all inputs
9. **Data Protection** - Hashed sensitive data (ID, account numbers)
10. **Transaction Integrity** - HMAC-SHA256 signing

</details>

### 🔒 DevSecOps Pipeline

- **CircleCI Integration** - Automated CI/CD pipeline
- **SonarQube Analysis** - Code quality, security hotspots, code smells
- **Automated Testing** - Unit tests with coverage reports
- **Security Auditing** - npm audit for vulnerability detection
- **GitHub Actions** - Enhanced security scanning workflows

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** 12+
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone <https://github.com/Leendouh/International-Payments-Portal.git>
cd InternationalPaymentsPortal

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Configure environment variables
cp backend/.env.example backend/.env
# Edit .env with your database credentials and secrets

# Generate SSL certificates
cd backend
npm run generate-certs

# Initialize database
npm run init-db
```

### Running the Application

```bash
# Terminal 1 - Start Backend (HTTPS on port 8443)
cd backend
npm start

# Terminal 2 - Start Frontend (HTTP on port 3000)
cd frontend
npm run dev
```

**Access URLs:**
- **Customer Portal**: http://localhost:3000
- **Employee Portal**: http://localhost:3000/employee/login
- **Backend API**: https://localhost:8443
- **Health Check**: https://localhost:8443/health

---

## 👥 Portal Features

### 🏦 Customer Portal

| Feature | Description |
|---------|-------------|
| **Registration** | Secure account creation with ID validation |
| **Login** | JWT-based authentication with session management |
| **Dashboard** | Overview of account and recent transactions |
| **Payment Creation** | Create international payments with validation |
| **Payment History** | View all past transactions with pagination |
| **Real-time Updates** | WebSocket notifications for transaction status |

### 👔 Employee Portal

| Feature | Description |
|---------|-------------|
| **Employee Login** | Secure authentication with role-based access |
| **Dashboard** | View pending and approved transactions |
| **Transaction Approval** | Managers can approve pending transactions |
| **Transaction Processing** | Admins can process approved transactions |
| **Transaction Rejection** | Admins can reject transactions |
| **Transaction History** | View all transactions with status filtering |
| **Employee Management** | Admins can create and manage employees |
| **Profile Management** | View and update employee profile |

### 🔑 Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Employee** | View pending/approved transactions, view details |
| **Manager** | Approve transactions, view all transactions |
| **Admin** | Full access: approve, reject, process, create employees |

---

## 📊 Test Credentials

### Customer Portal

| Email | Password | Account Number |
|-------|----------|----------------|
| customer@example.com | SecureP@ssw0rd123! | 1234567890 |

### Employee Portal

| Username | Password | Role |
|----------|----------|------|
| admin | AdminP@ssw0rd789! | Admin |
| manager | ManagerP@ssw0rd456! | Manager |
| employee | EmployeeP@ssw0rd123! | Employee |

---

## 📁 Project Structure

```
InternationalPaymentsPortal/
├── backend/
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   ├── employeeAuth.js      # Employee authentication
│   │   ├── csrf.js              # CSRF protection
│   │   ├── rateLimiter.js       # Rate limiting
│   │   └── securityHeaders.js   # Security headers
│   ├── routes/
│   │   ├── auth.js              # Customer authentication
│   │   ├── employee.js          # Employee routes
│   │   └── payments.js          # Payment management
│   ├── utils/
│   │   ├── database.js          # Database connection
│   │   ├── hash.js              # Password hashing
│   │   ├── inputWhitelist.js    # Input validation
│   │   └── accountLockout.js    # Lockout mechanism
│   ├── server.js                # Main server
│   └── init-database.js         # Database initialization
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── PaymentForm.jsx
│   │   │   ├── PaymentHistory.jsx
│   │   │   ├── EmployeeLogin.jsx
│   │   │   ├── EmployeeDashboard.jsx
│   │   │   ├── EmployeeProfile.jsx
│   │   │   └── TransactionHistory.jsx
│   │   ├── hooks/
│   │   │   └── useAuth.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   └── App.jsx
│   └── package.json
├── .circleci/
│   └── config.yml               # CircleCI pipeline
├── .github/
│   └── workflows/
│       └── security.yml         # GitHub Actions security
├── sonar-project.properties     # SonarQube config
└── README.md
```

---

## 🔌 API Endpoints

### Customer Authentication
- `POST /api/auth/register` - Customer registration
- `POST /api/auth/login` - Customer login
- `POST /api/auth/logout` - Customer logout
- `GET /api/auth/profile` - Get customer profile
- `GET /api/auth/csrf-token` - Get CSRF token

### Employee Authentication
- `POST /api/employee/login` - Employee login
- `GET /api/employee/profile` - Get employee profile
- `POST /api/employee/create` - Create employee (admin only)
- `GET /api/employee/all` - List all employees (admin only)

### Transaction Management
- `POST /api/payments` - Create payment
- `GET /api/payments` - Get payment history
- `GET /api/payments/:id` - Get payment details
- `GET /api/employee/pending-transactions` - Get pending transactions
- `GET /api/employee/transaction-history` - Get all transactions (with filter)
- `POST /api/employee/verify/:id` - Approve transaction
- `POST /api/employee/submit/:id` - Process transaction
- `POST /api/employee/reject/:id` - Reject transaction

### Utilities
- `GET /api/payments/currencies/list` - Get supported currencies
- `GET /api/payments/providers/list` - Get supported providers
- `GET /health` - Health check endpoint

---

## 🔧 Development

### Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Backend linting
cd backend
npm run lint

# Frontend linting
cd frontend
npm run lint

# Security audit
cd backend
npm audit
cd frontend
npm audit
```

### Database Schema

| Table | Description |
|-------|-------------|
| `customers` | Customer accounts with hashed sensitive data |
| `employees` | Employee accounts with role-based access |
| `transactions` | Payment records with HMAC signatures |
| `user_sessions` | Secure session management |
| `audit_log` | Comprehensive audit trail |

---

## 🔒 Security Configuration

### Password Hashing
- **Algorithm**: scrypt (Node.js crypto module)
- **Salt rounds**: 12
- **Derived key length**: 64 bytes
- **Memory limit**: 64MB
- **Format**: `salt:hash`

### Input Whitelisting
- 20+ input types with specific RegEx patterns
- Sanitization for XSS, SQL injection, path traversal
- Length restrictions on all inputs
- Examples: fullName, email, idNumber, accountNumber, amount, currency, swiftBic

### SSL/TLS Configuration
- **Minimum TLS version**: 1.2
- **Cipher suites**: ECDHE with AES-GCM and ChaCha20
- **HSTS**: Enabled with 1-year max-age
- **Certificate**: Self-signed for development

### Rate Limiting
- **General**: 1000 requests/15min per IP
- **Authentication**: 100 requests/1min per IP
- **Payments**: 50 requests/1min per user/IP
- **Password Reset**: 3 requests/15min per IP

### Account Lockout
- **Failed attempts threshold**: 5
- **Lockout duration**: 15 minutes
- **IP-based lockout**: Enabled
- **Countdown timer**: Provided to user

### Security Headers
- Content Security Policy (CSP)
- Strict Transport Security (HSTS)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer Policy: strict-origin-when-cross-origin

---

## 📊 Monitoring & Logging

- **Audit Log**: All security events logged to database and files
- **Error Logging**: Comprehensive error tracking
- **Performance Metrics**: Request timing and response monitoring
- **Security Events**: Failed logins, rate limits, validation failures

---

## 🚨 Important Notes

- This is a **demonstration portal** for academic purposes
- All payments are created with "pending" status
- Do not use real financial information
- SSL certificates are self-signed (browser warnings expected)
- In production, use certificates from trusted CA

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

<div align="center">

**Built with ❤️ for Secure Development**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://postgresql.org)

</div>
