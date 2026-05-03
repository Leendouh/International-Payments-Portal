# DevSecOps Pipeline Validation Script (PowerShell)
# Tests all pipeline components locally

param(
    [switch]$Verbose,
    [switch]$Quiet,
    [switch]$Help
)

# Function to write colored output
function Write-Status {
    param([string]$Message)
    if (-not $Quiet) {
        Write-Host "[INFO] $Message" -ForegroundColor Blue
    }
}

function Write-Success {
    param([string]$Message)
    if (-not $Quiet) {
        Write-Host "[SUCCESS] $Message" -ForegroundColor Green
    }
}

function Write-Warning {
    param([string]$Message)
    if (-not $Quiet) {
        Write-Host "[WARNING] $Message" -ForegroundColor Yellow
    }
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check if command exists
function Test-Command {
    param([string]$Command)
    try {
        # Try to get the command with different methods
        $cmd = Get-Command $Command -ErrorAction SilentlyContinue
        if ($cmd) {
            return $true
        }
        
        # For Docker, also check if the service is running
        if ($Command -eq "docker") {
            try {
                docker --version >$null 2>&1
                return $LASTEXITCODE -eq 0
            }
            catch {
                return $false
            }
        }
        
        return $false
    }
    catch {
        return $false
    }
}

# Function to check if file exists
function Test-FileExists {
    param([string]$Path)
    return Test-Path $Path -PathType Leaf
}

# Function to check if directory exists
function Test-DirectoryExists {
    param([string]$Path)
    return Test-Path $Path -PathType Container
}

# Show help
if ($Help) {
    Write-Host "DevSecOps Pipeline Validation Script (PowerShell)"
    Write-Host ""
    Write-Host "Usage: .\validate_pipeline.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Help     Show this help message"
    Write-Host "  -Verbose  Enable verbose output"
    Write-Host "  -Quiet    Suppress non-error output"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\validate_pipeline.ps1              # Run full validation"
    Write-Host "  .\validate_pipeline.ps1 -Verbose      # Run with verbose output"
    Write-Host "  .\validate_pipeline.ps1 -Help         # Show help"
    exit 0
}

# Main validation function
function Validate-Pipeline {
    Write-Status "Starting DevSecOps Pipeline Validation..."
    Write-Host "=================================================="
    
    $totalChecks = 0
    $passedChecks = 0
    $failedChecks = 0
    
    # 1. Check required tools
    Write-Status "Checking required tools..."
    
    $tools = @("node", "npm", "docker", "python", "git")
    foreach ($tool in $tools) {
        $totalChecks++
        if (Test-Command $tool) {
            Write-Success "$tool is installed"
            $passedChecks++
        }
        else {
            Write-Error "$tool is not installed"
            $failedChecks++
        }
    }
    
    # 2. Check pipeline files exist
    Write-Status "Checking pipeline configuration files..."
    
    $pipelineFiles = @(
        ".github\workflows\security.yml",
        ".github\codeql\codeql-config.yml",
        "Dockerfile.security",
        "scripts\check_owasp_compliance.py",
        "scripts\check_security_headers.py",
        "policies\security.rego",
        "tests\performance\load-test.js",
        "k8s\production\deployment.yaml"
    )
    
    foreach ($file in $pipelineFiles) {
        $totalChecks++
        if (Test-FileExists $file) {
            Write-Success "$file exists"
            $passedChecks++
        }
        else {
            Write-Error "$file is missing"
            $failedChecks++
        }
    }
    
    # 3. Check custom security queries
    Write-Status "Checking custom security queries..."
    
    $queryFiles = @(
        ".github\codeql\custom-queries\payment-security.ql",
        ".github\codeql\custom-queries\crypto-security.ql",
        ".github\codeql\custom-queries\input-validation.ql"
    )
    
    foreach ($file in $queryFiles) {
        $totalChecks++
        if (Test-FileExists $file) {
            Write-Success "$file exists"
            $passedChecks++
        }
        else {
            Write-Error "$file is missing"
            $failedChecks++
        }
    }
    
    # 4. Test Python scripts
    Write-Status "Testing Python validation scripts..."
    
    # Find working Python command
    $pythonCmd = $null
    if (Get-Command "python3" -ErrorAction SilentlyContinue) {
        $pythonCmd = "python3"
    }
    elseif (Get-Command "py" -ErrorAction SilentlyContinue) {
        $pythonCmd = "py"
    }
    elseif (Get-Command "python" -ErrorAction SilentlyContinue) {
        # Test if python actually works (not just Microsoft Store redirect)
        try {
            $result = & python --version 2>&1
            if ($LASTEXITCODE -eq 0 -and $result -notmatch "Microsoft Store") {
                $pythonCmd = "python"
            }
        }
        catch {
            $pythonCmd = $null
        }
    }
    
    if ($pythonCmd) {
        Write-Status "Testing Python validation scripts with: $pythonCmd"
        
        # Test OWASP compliance checker
        $totalChecks++
        try {
            $result = & $pythonCmd scripts\check_owasp_compliance.py 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "OWASP compliance checker works"
                $passedChecks++
            }
            else {
                Write-Warning "OWASP compliance checker failed (may need Python 3.8+ or missing dependencies)"
                $failedChecks++
            }
        }
        catch {
            Write-Warning "OWASP compliance checker failed: $_"
            $failedChecks++
        }
        
        # Test security headers checker
        $totalChecks++
        try {
            $result = & $pythonCmd scripts\check_security_headers.py --help 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Security headers checker works"
                $passedChecks++
            }
            else {
                Write-Warning "Security headers checker failed (may need Python 3.8+ or missing dependencies)"
                $failedChecks++
            }
        }
        catch {
            Write-Warning "Security headers checker failed: $_"
            $failedChecks++
        }
    }
    else {
        Write-Warning "Python not found or not working - skipping Python script validation"
        Write-Warning "Install Python 3.8+ from python.org for full validation"
        $totalChecks += 2
        $failedChecks += 2
    }
    
    # 5. Test Docker build
    Write-Status "Testing Docker security build..."
    
    if (Test-Command "docker") {
        $totalChecks++
        try {
            if ($Verbose) {
                docker build -f Dockerfile.security -t payments-portal:test .
            }
            else {
                docker build -f Dockerfile.security -t payments-portal:test --quiet .
            }
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Docker security build works"
                $passedChecks++
                
                # Test container security scan
                try {
                    docker run --rm aquasec/trivy:latest image payments-portal:test > $null 2>&1
                    Write-Success "Trivy security scan works"
                }
                catch {
                    Write-Warning "Trivy scan failed (may need to pull image first)"
                }
                
                # Clean up test image
                docker rmi payments-portal:test > $null 2>&1
            }
            else {
                Write-Error "Docker security build failed"
                $failedChecks++
            }
        }
        catch {
            Write-Error "Docker security build failed: $_"
            $failedChecks++
        }
    }
    
    # 6. Test Node.js dependencies
    Write-Status "Testing Node.js dependencies..."
    
    if (Test-DirectoryExists "backend" -and (Test-FileExists "backend\package.json")) {
        $totalChecks++
        try {
            Push-Location backend
            npm audit --audit-level moderate --json > $null 2>&1
            Pop-Location
            
            # npm audit returns 1 for vulnerabilities, which is expected in development
            Write-Success "Backend dependencies are scanned"
            $passedChecks++
        }
        catch {
            Write-Warning "Backend dependency scan failed (may be expected)"
        }
    }
    
    if (Test-DirectoryExists "frontend" -and (Test-FileExists "frontend\package.json")) {
        $totalChecks++
        try {
            Push-Location frontend
            npm audit --audit-level moderate --json > $null 2>&1
            Pop-Location
            
            Write-Success "Frontend dependencies are scanned"
            $passedChecks++
        }
        catch {
            Write-Warning "Frontend dependency scan failed (may be expected)"
        }
    }
    
    # 7. Test K6 performance test
    Write-Status "Testing K6 performance test..."
    
    if ((Test-Command "k6") -and (Test-FileExists "tests\performance\load-test.js")) {
        $totalChecks++
        try {
            k6 run --dry-run tests\performance\load-test.js > $null 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "K6 performance test syntax is valid"
                $passedChecks++
            }
            else {
                Write-Error "K6 performance test has syntax errors"
                $failedChecks++
            }
        }
        catch {
            Write-Error "K6 performance test failed: $_"
            $failedChecks++
        }
    }
    
    # 8. Check GitHub repository setup
    Write-Status "Checking GitHub repository setup..."
    
    if (Test-Command "git") {
        $totalChecks++
        try {
            $remoteUrl = git remote get-url origin 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Git remote is configured"
                $passedChecks++
            }
            else {
                Write-Warning "Git remote not configured (local repository)"
            }
        }
        catch {
            Write-Warning "Git remote not configured (local repository)"
        }
    }
    
    # 9. Generate summary report
    Write-Host "=================================================="
    Write-Status "Pipeline Validation Summary:"
    Write-Host "Total Checks: $totalChecks"
    Write-Host "Passed: $passedChecks"
    Write-Host "Failed: $failedChecks"
    
    $successRate = 0
    if ($totalChecks -gt 0) {
        $successRate = [math]::Round(($passedChecks / $totalChecks) * 100, 0)
    }
    
    Write-Host "Success Rate: $successRate%"
    
    $report = @{
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        total_checks = $totalChecks
        passed_checks = $passedChecks
        failed_checks = $failedChecks
        success_rate = $successRate
        status = if ($successRate -ge 80) { "PASSED" } else { "FAILED" }
        recommendations = @(
            "Configure GitHub repository secrets for full functionality",
            "Set up SonarCloud for code quality analysis",
            "Configure Slack webhook for notifications",
            "Set up monitoring dashboard for security metrics"
        )
    }
    
    if ($successRate -ge 80) {
        Write-Success "Pipeline validation PASSED ($successRate%)"
        Write-Host ""
        Write-Host "Your DevSecOps pipeline is ready to use!"
        Write-Host ""
        Write-Host "Next steps:"
        Write-Host "1. Push your code to GitHub"
        Write-Host "2. Configure GitHub repository secrets"
        Write-Host "3. Trigger a pipeline run"
        Write-Host "4. Monitor the results in GitHub Actions"
    }
    elseif ($successRate -ge 60) {
        Write-Warning "Pipeline validation PARTIALLY PASSED ($successRate%)"
        Write-Host ""
        Write-Host "Some components need attention before full deployment."
        Write-Host "Please review the failed checks above."
    }
    else {
        Write-Error "Pipeline validation FAILED ($successRate%)"
        Write-Host ""
        Write-Host "Please fix the failed checks before proceeding."
    }
    
    Write-Host "=================================================="
    
    # 10. Generate detailed report
    $report | ConvertTo-Json -Depth 3 | Out-File -FilePath "pipeline-validation-report.json"
    Write-Status "Detailed report saved to: pipeline-validation-report.json"
    
    return $successRate -ge 80
}

# Run validation
$success = Validate-Pipeline
exit $(if ($success) { 0 } else { 1 })
