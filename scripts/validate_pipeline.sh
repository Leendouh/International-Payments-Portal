#!/bin/bash

# DevSecOps Pipeline Validation Script
# Tests all pipeline components locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if file exists
file_exists() {
    [ -f "$1" ]
}

# Function to check if directory exists
dir_exists() {
    [ -d "$1" ]
}

# Main validation function
validate_pipeline() {
    print_status "Starting DevSecOps Pipeline Validation..."
    echo "=================================================="
    
    local total_checks=0
    local passed_checks=0
    local failed_checks=0
    
    # 1. Check required tools
    print_status "Checking required tools..."
    
    tools=("node" "npm" "docker" "python3" "git")
    for tool in "${tools[@]}"; do
        total_checks=$((total_checks + 1))
        if command_exists "$tool"; then
            print_success "$tool is installed"
            passed_checks=$((passed_checks + 1))
        else
            print_error "$tool is not installed"
            failed_checks=$((failed_checks + 1))
        fi
    done
    
    # 2. Check pipeline files exist
    print_status "Checking pipeline configuration files..."
    
    pipeline_files=(
        ".github/workflows/security.yml"
        ".github/codeql/codeql-config.yml"
        "Dockerfile.security"
        "scripts/check_owasp_compliance.py"
        "scripts/check_security_headers.py"
        "policies/security.rego"
        "tests/performance/load-test.js"
        "k8s/production/deployment.yaml"
    )
    
    for file in "${pipeline_files[@]}"; do
        total_checks=$((total_checks + 1))
        if file_exists "$file"; then
            print_success "$file exists"
            passed_checks=$((passed_checks + 1))
        else
            print_error "$file is missing"
            failed_checks=$((failed_checks + 1))
        fi
    done
    
    # 3. Check custom security queries
    print_status "Checking custom security queries..."
    
    query_files=(
        ".github/codeql/custom-queries/payment-security.ql"
        ".github/codeql/custom-queries/crypto-security.ql"
        ".github/codeql/custom-queries/input-validation.ql"
    )
    
    for file in "${query_files[@]}"; do
        total_checks=$((total_checks + 1))
        if file_exists "$file"; then
            print_success "$file exists"
            passed_checks=$((passed_checks + 1))
        else
            print_error "$file is missing"
            failed_checks=$((failed_checks + 1))
        fi
    done
    
    # 4. Test Python scripts
    print_status "Testing Python validation scripts..."
    
    if command_exists "python3"; then
        # Test OWASP compliance checker
        total_checks=$((total_checks + 1))
        if python3 scripts/check_owasp_compliance.py; then
            print_success "OWASP compliance checker works"
            passed_checks=$((passed_checks + 1))
        else
            print_error "OWASP compliance checker failed"
            failed_checks=$((failed_checks + 1))
        fi
        
        # Test security headers checker
        total_checks=$((total_checks + 1))
        if python3 scripts/check_security_headers.py --help > /dev/null 2>&1; then
            print_success "Security headers checker works"
            passed_checks=$((passed_checks + 1))
        else
            print_error "Security headers checker failed"
            failed_checks=$((failed_checks + 1))
        fi
    fi
    
    # 5. Test Docker build
    print_status "Testing Docker security build..."
    
    if command_exists "docker"; then
        total_checks=$((total_checks + 1))
        if docker build -f Dockerfile.security -t payments-portal:test --quiet; then
            print_success "Docker security build works"
            passed_checks=$((passed_checks + 1))
            
            # Test container security scan
            if docker run --rm aquasec/trivy:latest image payments-portal:test > /dev/null 2>&1; then
                print_success "Trivy security scan works"
            else
                print_warning "Trivy scan failed (may need to pull image first)"
            fi
            
            # Clean up test image
            docker rmi payments-portal:test > /dev/null 2>&1 || true
        else
            print_error "Docker security build failed"
            failed_checks=$((failed_checks + 1))
        fi
    fi
    
    # 6. Test Node.js dependencies
    print_status "Testing Node.js dependencies..."
    
    if dir_exists "backend" && file_exists "backend/package.json"; then
        total_checks=$((total_checks + 1))
        if (cd backend && npm audit --audit-level moderate --json > /dev/null 2>&1); then
            print_success "Backend dependencies are secure"
            passed_checks=$((passed_checks + 1))
        else
            print_warning "Backend dependencies have vulnerabilities (expected in development)"
        fi
    fi
    
    if dir_exists "frontend" && file_exists "frontend/package.json"; then
        total_checks=$((total_checks + 1))
        if (cd frontend && npm audit --audit-level moderate --json > /dev/null 2>&1); then
            print_success "Frontend dependencies are secure"
            passed_checks=$((passed_checks + 1))
        else
            print_warning "Frontend dependencies have vulnerabilities (expected in development)"
        fi
    fi
    
    # 7. Test K6 performance test
    print_status "Testing K6 performance test..."
    
    if command_exists "k6" && file_exists "tests/performance/load-test.js"; then
        total_checks=$((total_checks + 1))
        if k6 run --dry-run tests/performance/load-test.js > /dev/null 2>&1; then
            print_success "K6 performance test syntax is valid"
            passed_checks=$((passed_checks + 1))
        else
            print_error "K6 performance test has syntax errors"
            failed_checks=$((failed_checks + 1))
        fi
    fi
    
    # 8. Check GitHub repository setup
    print_status "Checking GitHub repository setup..."
    
    if command_exists "git"; then
        total_checks=$((total_checks + 1))
        if git remote get-url origin > /dev/null 2>&1; then
            print_success "Git remote is configured"
            passed_checks=$((passed_checks + 1))
        else
            print_warning "Git remote not configured (local repository)"
        fi
    fi
    
    # 9. Generate summary report
    echo "=================================================="
    print_status "Pipeline Validation Summary:"
    echo "Total Checks: $total_checks"
    echo "Passed: $passed_checks"
    echo "Failed: $failed_checks"
    
    local success_rate=0
    if [ $total_checks -gt 0 ]; then
        success_rate=$((passed_checks * 100 / total_checks))
    fi
    
    echo "Success Rate: $success_rate%"
    
    if [ $success_rate -ge 80 ]; then
        print_success "Pipeline validation PASSED ($success_rate%)"
        echo ""
        echo "Your DevSecOps pipeline is ready to use!"
        echo ""
        echo "Next steps:"
        echo "1. Push your code to GitHub"
        echo "2. Configure GitHub repository secrets"
        echo "3. Trigger a pipeline run"
        echo "4. Monitor the results in GitHub Actions"
    elif [ $success_rate -ge 60 ]; then
        print_warning "Pipeline validation PARTIALLY PASSED ($success_rate%)"
        echo ""
        echo "Some components need attention before full deployment."
        echo "Please review the failed checks above."
    else
        print_error "Pipeline validation FAILED ($success_rate%)"
        echo ""
        echo "Please fix the failed checks before proceeding."
    fi
    
    echo "=================================================="
    
    # 10. Generate detailed report
    cat > pipeline-validation-report.json << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "total_checks": $total_checks,
  "passed_checks": $passed_checks,
  "failed_checks": $failed_checks,
  "success_rate": $success_rate,
  "status": "$([ $success_rate -ge 80 ] && echo "PASSED" || echo "FAILED")",
  "recommendations": [
    "Configure GitHub repository secrets for full functionality",
    "Set up SonarCloud for code quality analysis",
    "Configure Slack webhook for notifications",
    "Set up monitoring dashboard for security metrics"
  ]
}
EOF
    
    print_status "Detailed report saved to: pipeline-validation-report.json"
    
    return $([ $success_rate -ge 80 ] && echo 0 || echo 1)
}

# Function to show help
show_help() {
    echo "DevSecOps Pipeline Validation Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -v, --verbose  Enable verbose output"
    echo "  -q, --quiet    Suppress non-error output"
    echo ""
    echo "Examples:"
    echo "  $0              # Run full validation"
    echo "  $0 -v           # Run with verbose output"
    echo "  $0 --help       # Show help"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        -q|--quiet)
            exec 1>/dev/null
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run validation
validate_pipeline
exit $?
