#!/usr/bin/env python3
"""
Security Headers Checker
Validates security headers implementation
"""

import json
import sys
import os
import requests
import time
from urllib.parse import urlparse

class SecurityHeadersChecker:
    def __init__(self, target_url="http://localhost:8443"):
        self.target_url = target_url
        self.results = {
            'headers_checked': 0,
            'headers_passed': 0,
            'headers_failed': 0,
            'missing_headers': [],
            'weak_headers': [],
            'recommendations': []
        }
        
        # Required security headers with their expected values
        self.required_headers = {
            'X-Frame-Options': ['DENY', 'SAMEORIGIN'],
            'X-Content-Type-Options': ['nosniff'],
            'X-XSS-Protection': ['1; mode=block'],
            'Referrer-Policy': ['strict-origin-when-cross-origin', 'no-referrer', 'same-origin'],
            'Content-Security-Policy': None, # Any CSP is better than none
            'Strict-Transport-Security': None, # Any HSTS is better than none
            'Permissions-Policy': None, # Any permissions policy is better than none
            'X-Permitted-Cross-Domain-Policies': ['none'],
            'Cross-Origin-Embedder-Policy': ['require-corp'],
            'Cross-Origin-Opener-Policy': ['same-origin'],
            'Cross-Origin-Resource-Policy': ['same-origin']
        }
    
    def check_headers(self):
        """Check security headers on the target URL"""
        print(f"🔍 Checking security headers for {self.target_url}")
        print("=" * 60)

        try:
            # Enable SSL verification for production security
            # For development with self-signed certs, provide cert path via environment variable
            cert_path = os.environ.get('SSL_CERT_PATH')
            verify_cert = cert_path if cert_path else True

            response = requests.get(self.target_url, timeout=10, verify=verify_cert)
            headers = response.headers
            
            for header, expected_values in self.required_headers.items():
                self.results['headers_checked'] += 1
                
                if header in headers:
                    header_value = headers[header]
                    self._evaluate_header(header, header_value, expected_values)
                else:
                    self.results['missing_headers'].append(header)
                    self.results['headers_failed'] += 1
                    print(f"❌ {header}: MISSING")
            
            # Additional security checks
            self._check_additional_security(headers)
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Error connecting to {self.target_url}: {e}")
            return False
        
        return True
    
    def _evaluate_header(self, header, value, expected_values):
        """Evaluate individual header"""
        if expected_values is None:
            # Any value is acceptable
            self.results['headers_passed'] += 1
            print(f"✅ {header}: {value}")
        elif any(expected in value for expected in expected_values):
            self.results['headers_passed'] += 1
            print(f"✅ {header}: {value}")
        else:
            self.results['headers_failed'] += 1
            self.results['weak_headers'].append(f"{header}: {value}")
            print(f"⚠️  {header}: {value} (weak)")
    
    def _check_additional_security(self, headers):
        """Check additional security aspects"""
        print("\n🔍 Additional Security Checks:")
        
        # Check for information disclosure
        server_header = headers.get('Server', '')
        if server_header and not any(product in server_header.lower() for product in ['nginx', 'apache', 'cloudflare']):
            self.results['recommendations'].append("Consider hiding server version information")
            print(f"⚠️  Server header reveals information: {server_header}")
        
        # Check for powered by header
        powered_by = headers.get('X-Powered-By', '')
        if powered_by:
            self.results['recommendations'].append("Consider removing X-Powered-By header")
            print(f"⚠️  X-Powered-By header reveals technology: {powered_by}")
        
        # Check for cache control
        cache_control = headers.get('Cache-Control', '')
        if 'no-store' not in cache_control.lower():
            self.results['recommendations'].append("Consider adding 'no-store' to Cache-Control for sensitive pages")
        
        # Check for CORS headers
        cors_header = headers.get('Access-Control-Allow-Origin', '')
        if cors_header == '*':
            self.results['recommendations'].append("Consider restricting CORS to specific origins instead of '*'")
    
    def generate_report(self):
        """Generate security headers report"""
        report = {
            'target_url': self.target_url,
            'timestamp': '2026-05-03T20:00:00Z',
            'results': self.results,
            'summary': {
                'security_score': 0,
                'grade': 'F'
            }
        }
        
        # Calculate security score
        if self.results['headers_checked'] > 0:
            score = (self.results['headers_passed'] / self.results['headers_checked']) * 100
            report['summary']['security_score'] = round(score, 2)
            
            # Assign grade
            if score >= 90:
                report['summary']['grade'] = 'A'
            elif score >= 80:
                report['summary']['grade'] = 'B'
            elif score >= 70:
                report['summary']['grade'] = 'C'
            elif score >= 60:
                report['summary']['grade'] = 'D'
            else:
                report['summary']['grade'] = 'F'
        
        # Save report
        with open('security-headers-report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        return report
    
    def print_summary(self):
        """Print summary of results"""
        print("\n" + "=" * 60)
        print("📊 Security Headers Summary:")
        print(f"Headers Checked: {self.results['headers_checked']}")
        print(f"Headers Passed: {self.results['headers_passed']}")
        print(f"Headers Failed: {self.results['headers_failed']}")
        
        report = self.generate_report()
        print(f"Security Score: {report['summary']['security_score']}%")
        print(f"Grade: {report['summary']['grade']}")
        
        if self.results['missing_headers']:
            print(f"\n❌ Missing Headers:")
            for header in self.results['missing_headers']:
                print(f"  - {header}")
        
        if self.results['weak_headers']:
            print(f"\n⚠️  Weak Headers:")
            for header in self.results['weak_headers']:
                print(f"  - {header}")
        
        if self.results['recommendations']:
            print(f"\n💡 Recommendations:")
            for rec in self.results['recommendations']:
                print(f"  - {rec}")
        
        return report['summary']['security_score']

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Check security headers')
    parser.add_argument('--url', default='http://localhost:8443', help='Target URL to check')
    args = parser.parse_args()
    
    checker = SecurityHeadersChecker(args.url)
    
    if checker.check_headers():
        score = checker.print_summary()
        sys.exit(0 if score >= 80 else 1)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
