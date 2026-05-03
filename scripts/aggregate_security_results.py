#!/usr/bin/env python3
"""
Security Results Aggregation Script
Aggregates results from various security scanning tools into a unified report.
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

def aggregate_security_results():
    """Aggregate security scan results into a comprehensive report."""
    
    print("Aggregating security scan results...")
    
    # Initialize results structure
    aggregated_results = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "summary": {
            "total_scans": 0,
            "passed_scans": 0,
            "failed_scans": 0,
            "warnings": 0,
            "critical_issues": 0,
            "high_issues": 0,
            "medium_issues": 0,
            "low_issues": 0
        },
        "scans": {},
        "recommendations": []
    }
    
    # Define scan result files to look for
    scan_files = {
        "npm_audit": ["backend/npm-audit-results.json", "frontend/npm-audit-results.json"],
        "semgrep": ["semgrep-results.json"],
        "gitleaks": ["gitleaks-results.json"],
        "checkov": ["reports/checkov-results.sarif"],
        "trivy": ["trivy-results.json"],
        "zap": ["zap-results.json"],
        "nuclei": ["nuclei-results.json"],
        "codeql": ["codeql-results.sarif"]
    }
    
    # Process each scan type
    for scan_type, file_paths in scan_files.items():
        scan_results = []
        
        for file_path in file_paths:
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r') as f:
                        data = json.load(f)
                        scan_results.append(data)
                        print(f"✓ Found {scan_type} results in {file_path}")
                except Exception as e:
                    print(f"⚠ Error reading {file_path}: {e}")
        
        if scan_results:
            aggregated_results["scans"][scan_type] = scan_results
            aggregated_results["summary"]["total_scans"] += 1
            aggregated_results["summary"]["passed_scans"] += 1
            
            # Count issues (simplified - would need specific parsing for each tool)
            issues = count_issues_from_scan(scan_type, scan_results)
            for severity, count in issues.items():
                if severity in aggregated_results["summary"]:
                    aggregated_results["summary"][severity] += count
        else:
            print(f"⚠ No results found for {scan_type}")
            aggregated_results["summary"]["total_scans"] += 1
            aggregated_results["summary"]["warnings"] += 1
    
    # Generate recommendations
    aggregated_results["recommendations"] = generate_recommendations(aggregated_results)
    
    # Save aggregated results
    output_file = "security-report.json"
    try:
        with open(output_file, 'w') as f:
            json.dump(aggregated_results, f, indent=2)
        print(f"✓ Security report saved to {output_file}")
        
        # Print summary
        print("\n=== Security Scan Summary ===")
        summary = aggregated_results["summary"]
        print(f"Total Scans: {summary['total_scans']}")
        print(f"Passed: {summary['passed_scans']}")
        print(f"Failed: {summary['failed_scans']}")
        print(f"Warnings: {summary['warnings']}")
        print(f"Critical Issues: {summary['critical_issues']}")
        print(f"High Issues: {summary['high_issues']}")
        print(f"Medium Issues: {summary['medium_issues']}")
        print(f"Low Issues: {summary['low_issues']}")
        
    except Exception as e:
        print(f"Error saving security report: {e}")
        sys.exit(1)

def count_issues_from_scan(scan_type, scan_results):
    """Count issues from scan results (simplified implementation)."""
    issues = {
        "critical_issues": 0,
        "high_issues": 0,
        "medium_issues": 0,
        "low_issues": 0
    }
    
    # This is a simplified implementation
    # In a real scenario, you'd parse each tool's specific format
    if scan_type == "npm_audit":
        for result in scan_results:
            if isinstance(result, dict) and "vulnerabilities" in result:
                for vuln in result["vulnerabilities"]:
                    severity = vuln.get("severity", "low").lower()
                    if severity == "critical":
                        issues["critical_issues"] += 1
                    elif severity == "high":
                        issues["high_issues"] += 1
                    elif severity == "moderate" or severity == "medium":
                        issues["medium_issues"] += 1
                    else:
                        issues["low_issues"] += 1
    
    elif scan_type == "semgrep":
        for result in scan_results:
            if isinstance(result, dict) and "results" in result:
                for finding in result["results"]:
                    metadata = finding.get("metadata", {})
                    severity = metadata.get("impact", "INFO").lower()
                    if "critical" in severity:
                        issues["critical_issues"] += 1
                    elif "high" in severity:
                        issues["high_issues"] += 1
                    elif "medium" in severity or "moderate" in severity:
                        issues["medium_issues"] += 1
                    else:
                        issues["low_issues"] += 1
    
    # Add more parsers for other tools as needed
    return issues

def generate_recommendations(results):
    """Generate security recommendations based on scan results."""
    recommendations = []
    
    if results["summary"]["critical_issues"] > 0:
        recommendations.append("URGENT: Address critical security vulnerabilities immediately")
    
    if results["summary"]["high_issues"] > 0:
        recommendations.append("HIGH: Address high-severity issues within 7 days")
    
    if results["summary"]["medium_issues"] > 5:
        recommendations.append("MEDIUM: Consider addressing medium-severity issues in next sprint")
    
    # Check for missing scans
    expected_scans = ["npm_audit", "semgrep", "gitleaks", "checkov"]
    for scan in expected_scans:
        if scan not in results["scans"]:
            recommendations.append(f"CONFIG: Configure {scan} security scanning")
    
    # General recommendations
    recommendations.extend([
        "Regularly update dependencies to patch vulnerabilities",
        "Implement security code reviews in development process",
        "Set up automated security testing in CI/CD pipeline",
        "Monitor security dashboards for emerging threats"
    ])
    
    return recommendations

if __name__ == "__main__":
    try:
        aggregate_security_results()
        print("\n✓ Security results aggregation completed successfully")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
