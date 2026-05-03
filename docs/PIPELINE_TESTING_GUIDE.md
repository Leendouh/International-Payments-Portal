# DevSecOps Pipeline Testing Guide

## Overview

This guide provides step-by-step instructions to test and validate that your DevSecOps pipeline works correctly.

## Prerequisites

### Required Tools
```bash
# Install GitHub CLI
brew install gh  # macOS
# or
sudo apt install gh  # Ubuntu

# Install Docker
docker --version

# Install Node.js 18+
node --version

# Install Python 3.8+
python3 --version

# Install kubectl (for Kubernetes testing)
kubectl version --client
```

### GitHub Setup
1. Create a new repository or use existing one
2. Add required secrets to GitHub repository:
   - `GITHUB_TOKEN` (automatically available)
   - `SONAR_TOKEN` (from SonarCloud)
   - `SLACK_WEBHOOK_URL` (for notifications)
   - `SECURITY_DASHBOARD_URL` (for monitoring)
   - `GITLEAKS_LICENSE` (if using premium features)

## Testing Methods

### 1. Local Pipeline Testing

#### Test Security Scripts Locally
```bash
# Test OWASP compliance checker
cd scripts
python3 check_owasp_compliance.py

# Test security headers checker (server must be running)
python3 check_security_headers.py --url http://localhost:8443

# Test with custom URL
python3 check_security_headers.py --url https://your-domain.com
```

#### Test Docker Security Build
```bash
# Build security-hardened image
docker build -f Dockerfile.security -t payments-portal:test .

# Run security scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest image payments-portal:test

# Test container locally
docker run -d -p 8443:8443 --name payments-test payments-portal:test
curl -k https://localhost:8443/health
docker stop payments-test
```

### 2. GitHub Actions Pipeline Testing

#### Method 1: Create Test Branch
```bash
# Create test branch
git checkout -b test-pipeline

# Make a small change to trigger pipeline
echo "# Testing pipeline" >> README.md

# Commit and push
git add README.md
git commit -m "Test: Trigger DevSecOps pipeline"
git push origin test-pipeline

# Monitor pipeline in GitHub Actions
gh run list --branch test-pipeline
gh run view --branch test-pipeline
```

#### Method 2: Pull Request Testing
```bash
# Create feature branch
git checkout -b feature/security-test

# Add security test file
echo "console.log('Security test');" > test-security.js

# Commit and create PR
git add test-security.js
git commit -m "Add security test file"
git push origin feature/security-test

# Create PR (will trigger pipeline)
gh pr create --title "Test Security Pipeline" --body "Testing DevSecOps pipeline"
```

### 3. Pipeline Component Testing

#### Test SAST Tools
```bash
# Test CodeQL locally (requires CodeQL CLI)
codeql database create ./codeql-db --language=javascript --source-root=.
codeql database analyze ./codeql-db --format=csv --output=codeql-results.csv

# Test Semgrep locally
pip install semgrep
semgrep --config=auto --json --output=semgrep-results.json .

# Test SonarCloud locally (requires SonarScanner)
sonar-scanner \
  -Dsonar.projectKey=international-payments-portal \
  -Dsonar.sources=. \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.login=YOUR_SONAR_TOKEN
```

#### Test Dependency Scanning
```bash
# Test npm audit
cd backend
npm audit --audit-level moderate --json > npm-audit-results.json

# Test with safety (Python alternative)
pip install safety
safety check --json --output safety-results.json
```

#### Test Secret Scanning
```bash
# Test Gitleaks locally
gitleaks detect --source=. --verbose --report-format=json --report-path=gitleaks-results.json

# Test with truffleHog
pip install truffleHog
trufflehog --regex --entropy=False --json --output=trufflehog-results.json .
```

### 4. Security Testing Validation

#### Test Security Headers
```bash
# Run comprehensive header test
python3 scripts/check_security_headers.py --url http://localhost:8443

# Check specific headers
curl -I http://localhost:8443 | grep -E "(X-Frame|X-Content|X-XSS|CSP|HSTS)"

# Test with SSL Labs (online)
# Visit: https://www.ssllabs.com/ssltest/
```

#### Test Authentication Security
```bash
# Test login endpoint
curl -X POST http://localhost:8443/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong","accountNumber":"1234567890123456"}'

# Test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:8443/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test","accountNumber":"1234567890123456"}'
done
```

#### Test Input Validation
```bash
# Test SQL injection
curl -X POST http://localhost:8443/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com'; DROP TABLE users; --","password":"test","accountNumber":"123"}'

# Test XSS
curl -X POST http://localhost:8443/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<script>alert(1)</script>","password":"test","accountNumber":"123"}'
```

### 5. Performance Testing

#### Test Load with K6
```bash
# Install k6
brew install k6  # macOS
# or
sudo apt install k6  # Ubuntu

# Run load test
k6 run tests/performance/load-test.js

# Run with custom options
k6 run --vus 50 --duration 2m tests/performance/load-test.js
```

#### Test with Artillery
```bash
# Install artillery
npm install -g artillery

# Run artillery test
artillery run tests/performance/artillery-config.yml
```

### 6. Kubernetes Testing

#### Test Local Kubernetes
```bash
# Start minikube
minikube start

# Apply configurations
kubectl apply -f k8s/production/

# Check deployment
kubectl get pods -n production
kubectl logs -f deployment/international-payments-portal -n production

# Test service
minikube service international-payments-portal-service -n production
```

#### Test Security Policies
```bash
# Test network policies
kubectl exec -it deployment/international-payments-portal -n production -- \
  curl -X POST http://database-service:5432

# Should fail due to network policy

# Test pod security
kubectl get podsecuritypolicy
kubectl describe podsecuritypolicy restricted
```

## Validation Checklist

### ✅ Pipeline Components Validation

**GitHub Actions:**
- [ ] Workflow triggers on push/PR
- [ ] All jobs execute successfully
- [ ] Security scans complete without errors
- [ ] Artifacts are generated and uploaded
- [ ] Security gates pass/fail correctly

**SAST Tools:**
- [ ] CodeQL analysis completes
- [ ] Semgrep finds expected issues
- [ ] SonarCloud analysis works
- [ ] Custom queries execute correctly

**Container Security:**
- [ ] Docker build completes successfully
- [ ] Trivy scan runs and reports findings
- [ ] Security-hardened image runs properly
- [ ] Container passes security checks

**DAST Tools:**
- [ ] OWASP ZAP scan completes
- [ ] Nuclei finds expected vulnerabilities
- [ ] Security headers are validated
- [ ] Authentication flows are tested

### ✅ Security Validation

**Authentication & Authorization:**
- [ ] Login works with valid credentials
- [ ] Invalid credentials are rejected
- [ ] Account lockout functions correctly
- [ ] JWT tokens are validated properly

**Input Validation:**
- [ ] SQL injection attempts are blocked
- [ ] XSS attempts are blocked
- [ ] Input sanitization works
- [ ] Rate limiting is enforced

**SSL/TLS Security:**
- [ ] HTTPS works correctly
- [ ] TLS version is 1.2 or higher
- [ ] Security headers are present
- [ ] Certificate is valid

### ✅ Performance Validation

**Load Testing:**
- [ ] Application handles expected load
- [ ] Response times are acceptable
- [ ] Error rates are within limits
- [ ] Security features don't impact performance significantly

## Troubleshooting

### Common Issues

**Pipeline Fails:**
1. Check GitHub Actions logs
2. Verify secrets are configured correctly
3. Ensure all dependencies are installed
4. Check for syntax errors in configuration files

**Security Scan Errors:**
1. Update tool versions
2. Check for false positives
3. Review configuration files
4. Ensure proper file permissions

**Container Issues:**
1. Check Dockerfile syntax
2. Verify base image compatibility
3. Check resource limits
4. Review security configurations

**Kubernetes Problems:**
1. Check resource requirements
2. Verify RBAC permissions
3. Review network policies
4. Check secret configurations

### Debug Commands

```bash
# Check GitHub Actions status
gh run list --limit 10
gh run view <run-id>

# Debug Docker build
docker build -f Dockerfile.security --no-cache --progress=plain .

# Check Kubernetes logs
kubectl logs -f deployment/international-payments-portal -n production

# Test connectivity
curl -v http://localhost:8443/health
curl -v https://localhost:8443/health
```

## Success Criteria

Your DevSecOps pipeline is working correctly when:

1. **All pipeline jobs execute successfully**
2. **Security scans complete and report findings**
3. **Vulnerabilities are detected and reported**
4. **Security gates enforce policies**
5. **Deployments succeed only when security checks pass**
6. **Monitoring and alerting function properly**
7. **Compliance reports are generated**
8. **Performance tests meet requirements**

## Next Steps

Once validation is complete:

1. **Review security findings** and address critical issues
2. **Fine-tune security policies** based on results
3. **Set up monitoring dashboards**
4. **Configure alerting thresholds**
5. **Document security procedures**
6. **Train team on security practices**

## Support

For issues with:
- **GitHub Actions**: Check GitHub documentation
- **Security Tools**: Review tool-specific documentation
- **Kubernetes**: Consult Kubernetes docs
- **Custom Scripts**: Review script logs and error messages
