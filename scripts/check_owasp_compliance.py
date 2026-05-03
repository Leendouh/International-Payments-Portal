#!/usr/bin/env python3
"""
OWASP ASVS Compliance Checker
Checks application against OWASP Application Security Verification Standard
"""

import json
import sys
import os
import subprocess
import re
from pathlib import Path

class OWASPComplianceChecker:
    def __init__(self):
        self.results = {
            'asvs_level_2': {
                'total_checks': 0,
                'passed': 0,
                'failed': 0,
                'warnings': [],
                'errors': []
            }
        }
    
    def check_authentication_security(self):
        """Check authentication security requirements"""
        print("Checking Authentication Security (ASVS V2)...")
        
        # Check for password hashing
        try:
            with open('backend/utils/hash.js', 'r') as f:
                hash_content = f.read()
                if 'bcrypt' in hash_content:
                    self.results['asvs_level_2']['passed'] += 1
                    print("✅ Password hashing with bcrypt detected")
                else:
                    self.results['asvs_level_2']['failed'] += 1
                    self.results['asvs_level_2']['errors'].append("Weak password hashing detected")
                    print("❌ Weak password hashing detected")
        except FileNotFoundError:
            self.results['asvs_level_2']['warnings'].append("Hash utility not found")
        
        # Check for account lockout
        try:
            with open('backend/utils/accountLockout.js', 'r') as f:
                lockout_content = f.read()
                if 'recordFailedAttempt' in lockout_content:
                    self.results['asvs_level_2']['passed'] += 1
                    print("✅ Account lockout mechanism detected")
                else:
                    self.results['asvs_level_2']['failed'] += 1
                    self.results['asvs_level_2']['errors'].append("Account lockout not implemented")
                    print("❌ Account lockout not implemented")
        except FileNotFoundError:
            self.results['asvs_level_2']['warnings'].append("Account lockout utility not found")
        
        self.results['asvs_level_2']['total_checks'] += 2
    
    def check_session_management(self):
        """Check session management security"""
        print("Checking Session Management (ASVS V3)...")
        
        # Check for secure session configuration
        try:
            with open('backend/server.js', 'r') as f:
                server_content = f.read()
                if 'httpOnly' in server_content and 'secure' in server_content:
                    self.results['asvs_level_2']['passed'] += 1
                    print("✅ Secure session configuration detected")
                else:
                    self.results['asvs_level_2']['failed'] += 1
                    self.results['asvs_level_2']['errors'].append("Insecure session configuration")
                    print("❌ Insecure session configuration")
        except FileNotFoundError:
            self.results['asvs_level_2']['warnings'].append("Server configuration not found")
        
        # Check for JWT security
        try:
            with open('backend/middleware/auth.js', 'r') as f:
                auth_content = f.read()
                if 'jwt.verify' in auth_content and 'process.env.JWT_SECRET' in auth_content:
                    self.results['asvs_level_2']['passed'] += 1
                    print("✅ Secure JWT implementation detected")
                else:
                    self.results['asvs_level_2']['failed'] += 1
                    self.results['asvs_level_2']['errors'].append("Insecure JWT implementation")
                    print("❌ Insecure JWT implementation")
        except FileNotFoundError:
            self.results['asvs_level_2']['warnings'].append("Auth middleware not found")
        
        self.results['asvs_level_2']['total_checks'] += 2
    
    def check_input_validation(self):
        """Check input validation security"""
        print("Checking Input Validation (ASVS V4)...")
        
        # Check for comprehensive input validation
        try:
            with open('backend/utils/inputWhitelist.js', 'r') as f:
                validation_content = f.read()
                if 'validateInput' in validation_content and 'WHITELIST_PATTERNS' in validation_content:
                    self.results['asvs_level_2']['passed'] += 1
                    print("✅ Comprehensive input validation detected")
                else:
                    self.results['asvs_level_2']['failed'] += 1
                    self.results['asvs_level_2']['errors'].append("Insufficient input validation")
                    print("❌ Insufficient input validation")
        except FileNotFoundError:
            self.results['asvs_level_2']['warnings'].append("Input validation utility not found")
        
        # Check for SQL injection protection
        try:
            with open('backend/utils/database.js', 'r') as f:
                db_content = f.read()
                if 'parameterized' in db_content.lower() or 'prepared' in db_content.lower():
                    self.results['asvs_level_2']['passed'] += 1
                    print("✅ SQL injection protection detected")
                else:
                    self.results['asvs_level_2']['failed'] += 1
                    self.results['asvs_level_2']['errors'].append("SQL injection protection missing")
                    print("❌ SQL injection protection missing")
        except FileNotFoundError:
            self.results['asvs_level_2']['warnings'].append("Database utility not found")
        
        self.results['asvs_level_2']['total_checks'] += 2
    
    def check_crypto_security(self):
        """Check cryptographic security"""
        print("Checking Cryptographic Security (ASVS V6)...")
        
        # Check for strong cryptography
        try:
            with open('backend/utils/sslSecurity.js', 'r') as f:
                ssl_content = f.read()
                if 'TLS_AES_256_GCM_SHA384' in ssl_content and 'TLSv1.2' in ssl_content:
                    self.results['asvs_level_2']['passed'] += 1
                    print("✅ Strong TLS configuration detected")
                else:
                    self.results['asvs_level_2']['failed'] += 1
                    self.results['asvs_level_2']['errors'].append("Weak TLS configuration")
                    print("❌ Weak TLS configuration")
        except FileNotFoundError:
            self.results['asvs_level_2']['warnings'].append("SSL security utility not found")
        
        # Check for secure random generation
        try:
            with open('backend/utils/passwordPolicy.js', 'r') as f:
                crypto_content = f.read()
                if 'crypto.randomBytes' in crypto_content or 'crypto.randomUUID' in crypto_content:
                    self.results['asvs_level_2']['passed'] += 1
                    print("✅ Secure random generation detected")
                else:
                    self.results['asvs_level_2']['failed'] += 1
                    self.results['asvs_level_2']['errors'].append("Insecure random generation")
                    print("❌ Insecure random generation")
        except FileNotFoundError:
            self.results['asvs_level_2']['warnings'].append("Password policy utility not found")
        
        self.results['asvs_level_2']['total_checks'] += 2
    
    def check_error_handling(self):
        """Check error handling and logging"""
        print("Checking Error Handling (ASVS V7)...")
        
        # Check for secure error handling
        try:
            with open('backend/server.js', 'r') as f:
                server_content = f.read()
                if 'errorLog' in server_content and 'isDevelopment' in server_content:
                    self.results['asvs_level_2']['passed'] += 1
                    print("✅ Secure error handling detected")
                else:
                    self.results['asvs_level_2']['failed'] += 1
                    self.results['asvs_level_2']['errors'].append("Insecure error handling")
                    print("❌ Insecure error handling")
        except FileNotFoundError:
            self.results['asvs_level_2']['warnings'].append("Server configuration not found")
        
        # Check for audit logging
        try:
            with open('backend/utils/logger.js', 'r') as f:
                logger_content = f.read()
                if 'auditLog' in logger_content:
                    self.results['asvs_level_2']['passed'] += 1
                    print("✅ Audit logging detected")
                else:
                    self.results['asvs_level_2']['failed'] += 1
                    self.results['asvs_level_2']['errors'].append("Audit logging missing")
                    print("❌ Audit logging missing")
        except FileNotFoundError:
            self.results['asvs_level_2']['warnings'].append("Logger utility not found")
        
        self.results['asvs_level_2']['total_checks'] += 2
    
    def check_security_headers(self):
        """Check security headers implementation"""
        print("Checking Security Headers (ASVS V10)...")
        
        try:
            with open('backend/utils/attackProtection.js', 'r') as f:
                headers_content = f.read()
                required_headers = [
                    'X-Frame-Options',
                    'X-Content-Type-Options',
                    'X-XSS-Protection',
                    'Referrer-Policy',
                    'Content-Security-Policy'
                ]
                
                headers_found = 0
                for header in required_headers:
                    if header in headers_content:
                        headers_found += 1
                
                if headers_found >= 4:
                    self.results['asvs_level_2']['passed'] += 1
                    print(f"✅ {headers_found}/5 required security headers found")
                else:
                    self.results['asvs_level_2']['failed'] += 1
                    self.results['asvs_level_2']['errors'].append(f"Only {headers_found}/5 required security headers found")
                    print(f"❌ Only {headers_found}/5 required security headers found")
        except FileNotFoundError:
            self.results['asvs_level_2']['warnings'].append("Attack protection utility not found")
        
        self.results['asvs_level_2']['total_checks'] += 1
    
    def generate_report(self):
        """Generate compliance report"""
        report = {
            'compliance_level': 'ASVS Level 2',
            'timestamp': '2026-05-03T20:00:00Z',
            'results': self.results['asvs_level_2'],
            'summary': {
                'compliance_percentage': 0,
                'status': 'FAIL'
            }
        }
        
        total = self.results['asvs_level_2']['total_checks']
        passed = self.results['asvs_level_2']['passed']
        
        if total > 0:
            compliance_percentage = (passed / total) * 100
            report['summary']['compliance_percentage'] = round(compliance_percentage, 2)
            report['summary']['status'] = 'PASS' if compliance_percentage >= 80 else 'FAIL'
        
        # Save report
        with open('owasp-compliance-report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        return report
    
    def run_all_checks(self):
        """Run all compliance checks"""
        print("🔍 Running OWASP ASVS Level 2 Compliance Check...")
        print("=" * 60)
        
        self.check_authentication_security()
        self.check_session_management()
        self.check_input_validation()
        self.check_crypto_security()
        self.check_error_handling()
        self.check_security_headers()
        
        print("=" * 60)
        
        report = self.generate_report()
        
        print(f"\n📊 Compliance Summary:")
        print(f"Total Checks: {report['results']['total_checks']}")
        print(f"Passed: {report['results']['passed']}")
        print(f"Failed: {report['results']['failed']}")
        print(f"Warnings: {len(report['results']['warnings'])}")
        print(f"Compliance: {report['summary']['compliance_percentage']}%")
        print(f"Status: {report['summary']['status']}")
        
        if report['results']['errors']:
            print(f"\n❌ Errors:")
            for error in report['results']['errors']:
                print(f"  - {error}")
        
        if report['results']['warnings']:
            print(f"\n⚠️  Warnings:")
            for warning in report['results']['warnings']:
                print(f"  - {warning}")
        
        return report['summary']['status'] == 'PASS'

if __name__ == "__main__":
    checker = OWASPComplianceChecker()
    success = checker.run_all_checks()
    sys.exit(0 if success else 1)
