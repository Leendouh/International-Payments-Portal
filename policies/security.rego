package international.payments.security

# Security policy for International Payments Portal
# Implements OWASP ASVS Level 2 requirements

# Default deny for all requests
default deny = false

# Allow requests that meet all security requirements
deny {
    not input_secure
}

# Check if input meets security requirements
input_secure {
    check_authentication
    check_authorization
    check_input_validation
    check_rate_limiting
    check_ssl_tls
    check_security_headers
}

# Authentication security checks
check_authentication {
    # Require secure session management
    input.request.headers.cookie
    contains(input.request.headers.cookie, "HttpOnly")
    contains(input.request.headers.cookie, "Secure")
    
    # Require JWT token for API calls
    input.request.headers.authorization
    starts_with(input.request.headers.authorization, "Bearer ")
    
    # Validate JWT token structure
    count(split(input.request.headers.authorization, ".")) == 3
}

# Authorization security checks
check_authorization {
    # Check user permissions for sensitive operations
    input.request.method == "GET" or
    (input.request.method == "POST" and input.user.role in ["admin", "user"]) or
    (input.request.method in ["PUT", "DELETE"] and input.user.role == "admin")
}
}

# Input validation security checks
check_input_validation {
    # Validate email format
    not contains(input.request.body.email, "'")
    not contains(input.request.body.email, "\"")
    not contains(input.request.body.email, ";")
    not contains(input.request.body.email, "--")
    
    # Validate password strength
    input.request.body.password
    length(input.request.body.password) >= 12
    contains_uppercase(input.request.body.password)
    contains_lowercase(input.request.body.password)
    contains_digit(input.request.body.password)
    contains_special(input.request.body.password)
    
    # Validate amount format
    input.request.body.amount
    is_number(input.request.body.amount)
    to_number(input.request.body.amount) > 0
    to_number(input.request.body.amount) <= 1000000
}

# Rate limiting security checks
check_rate_limiting {
    # Check rate limit headers
    input.request.headers["x-ratelimit-remaining"]
    to_number(input.request.headers["x-ratelimit-remaining"]) >= 0
    
    # Check rate limit not exceeded
    input.request.headers["x-ratelimit-limit"]
    to_number(input.request.headers["x-ratelimit-limit"]) > 0
}

# SSL/TLS security checks
check_ssl_tls {
    # Require HTTPS
    input.request.protocol == "https"
    
    # Check TLS version
    input.request.tls.version in ["TLSv1.2", "TLSv1.3"]
    
    # Check cipher strength
    input.request.tls.cipher in [
        "TLS_AES_256_GCM_SHA384",
        "TLS_CHACHA20_POLY1305_SHA256",
        "TLS_AES_128_GCM_SHA256",
        "ECDHE-RSA-AES256-GCM-SHA384"
    ]
}

# Security headers validation
check_security_headers {
    # Required security headers
    input.response.headers["x-frame-options"]
    input.response.headers["x-content-type-options"]
    input.response.headers["x-xss-protection"]
    input.response.headers["referrer-policy"]
    input.response.headers["content-security-policy"]
    
    # HSTS header for HTTPS
    input.response.headers["strict-transport-security"]
    
    # Validate header values
    input.response.headers["x-frame-options"] in ["DENY", "SAMEORIGIN"]
    input.response.headers["x-content-type-options"] == "nosniff"
}

# Helper functions
contains_uppercase(s) {
    some i
    is_upper(s[i])
}

contains_lowercase(s) {
    some i
    is_lower(s[i])
}

contains_digit(s) {
    some i
    is_digit(s[i])
}

contains_special(s) {
    some i
    not is_alnum(s[i])
}

is_upper(c) {
    c >= "A" and c <= "Z"
}

is_lower(c) {
    c >= "a" and c <= "z"
}

is_digit(c) {
    c >= "0" and c <= "9"
}

is_alnum(c) {
    is_upper(c) or is_lower(c) or is_digit(c)
}

is_number(s) {
    is_digit(s[0])
}

to_number(s) = number

# Payment processing security rules
deny_payment_processing {
    input.request.path == "/api/payments/process"
    not payment_processing_secure
}

payment_processing_secure {
    # Require MFA for large transactions
    input.request.body.amount > 10000
    input.user.mfa_verified == true
    
    # Validate recipient account
    input.request.body.recipient_account
    length(input.request.body.recipient_account) >= 8
    length(input.request.body.recipient_account) <= 34
    
    # Check transaction limits
    input.user.daily_limit
    input.user.daily_spent + input.request.body.amount <= input.user.daily_limit
    
    # Validate currency
    input.request.body.currency in ["USD", "EUR", "GBP", "ZAR"]
    
    # Require additional verification for international transfers
    input.request.body.recipient_country != input.user.country
    input.user.kyc_verified == true
}

# Database access security rules
deny_database_access {
    input.operation.type == "database"
    not database_access_secure
}

database_access_secure {
    # Use parameterized queries
    contains(input.operation.query, "$")
    not contains(input.operation.query, "SELECT *")
    
    # Validate table access
    input.operation.table in ["customers", "transactions", "sessions"]
    
    # Check data access permissions
    input.user.role == "admin" or
    (input.user.role == "user" and input.operation.table in ["customers", "transactions"])
}

# Logging and monitoring requirements
require_audit_logging {
    input.request.path in [
        "/api/auth/login",
        "/api/auth/register",
        "/api/payments/process",
        "/api/users/profile"
    ]
    
    # Log sensitive operations
    input.request.method in ["POST", "PUT", "DELETE"]
    
    # Include security context in logs
    input.log.context.ip
    input.log.context.user_agent
    input.log.context.timestamp
}

# Compliance checks
check_gdpr_compliance {
    # Personal data protection
    input.request.body.email
    input.data.encryption == "AES-256"
    
    # Right to be forgotten
    input.operation.type == "delete"
    input.user.consent == true
}

check_pci_dss_compliance {
    # Payment card data protection
    input.request.body.payment_method == "card"
    input.data.encryption == "AES-256"
    input.data.tokenization == true
    
    # Access control
    input.user.role in ["admin", "payment-processor"]
    
    # Audit trail
    input.log.audit_trail == true
    input.log.retention_period >= 365
}
