# Task 3: Employee Portal - Video Demonstration Guide

## Overview
This guide outlines the steps to demonstrate the secure employee International Payments Portal for Task 3 submission.

## Demonstration Requirements
- Record a video showing all functionality working
- Use OBS Studio to record the demonstration
- Upload as an unlisted video to YouTube
- Include in your submission to the lecturer

## Demonstration Checklist

### 1. Password Security [20 marks]
**Show:**
- Employee login with password hashing and salting
- Password complexity requirements (12+ characters, mixed case, numbers, special chars)
- Scrypt hashing implementation in `backend/utils/hash.js`
- Password reset functionality for admins

**Script:**
- "I'll demonstrate the password security implementation using scrypt hashing with salt"
- Show the hash.js file with scrypt parameters
- Demonstrate employee login with a strong password
- Show password reset feature in admin profile

### 2. DevSecOps [30 marks]
**Show:**
- CircleCI pipeline configuration
- SonarQube scan setup in `.circleci/config.yml`
- SonarQube configuration in `sonar-project.properties`
- GitHub Actions security pipeline
- Security scanning results (dependency scan, secrets scan, container scan)

**Script:**
- "I've set up a comprehensive DevSecOps pipeline with CircleCI and SonarQube"
- Show the CircleCI configuration file
- Show the SonarQube properties file
- Show the GitHub Actions security workflow
- Demonstrate the pipeline running (if possible)

### 3. Static Login [10 marks]
**Show:**
- Employee login form at `/employee/login`
- No registration process for employees
- Admin creates employees via Employee Profile
- JWT token authentication
- Session management

**Script:**
- "Employees cannot self-register; only admins can create employee accounts"
- Demonstrate the employee login form
- Show that there's no registration link for employees
- Log in as an employee and show the dashboard
- Show the JWT token in localStorage

### 4. Overall Functioning [20 marks]
**Show:**
- Complete employee portal workflow:
  1. Admin logs in and creates a new employee
  2. Employee logs in
  3. Employee views dashboard with statistics
  4. Employee views pending transactions
  5. Employee approves a transaction
  6. Employee processes an approved transaction
  7. Employee rejects a transaction
  8. Employee views transaction details
  9. Admin views all employees
  10. Admin resets employee password

**Script:**
- "I'll demonstrate the complete employee portal workflow"
- Walk through each step systematically
- Show all security features in action (CSRF tokens, rate limiting, etc.)

## Security Features to Highlight

### Input Whitelisting
- Show `backend/utils/inputWhitelist.js` with comprehensive RegEx patterns
- Demonstrate validation on employee creation
- Show content-type validation middleware

### SSL/TLS Configuration
- Show `backend/server.js` SSL configuration
- Demonstrate HTTPS connection (show lock icon in browser)
- Show HSTS header configuration
- Show HTTP/2 support

### Attack Protections
- Show CSRF protection in action
- Show rate limiting (try multiple failed logins)
- Show XSS protection (helmet.js headers)
- Show SQL injection protection (parameterized queries)
- Show account lockout system

## Recording Tips

### Before Recording
1. Ensure backend server is running on HTTPS (port 8443)
2. Ensure frontend is running (port 3000)
3. Have test accounts ready:
   - Admin account
   - Employee account
4. Clear browser cache and localStorage
5. Open browser developer tools to show network requests

### During Recording
1. Speak clearly and slowly
2. Explain each feature as you demonstrate it
3. Show code files when relevant
4. Demonstrate error handling (e.g., wrong password)
5. Show security features in action
6. Keep the video under 10 minutes if possible

### After Recording
1. Upload to YouTube as unlisted
2. Add a clear title: "Task 3 - Employee Portal Demonstration"
3. Add description with key features demonstrated
4. Share the link with your lecturer

## Key Files to Reference in Video

### Backend
- `backend/server.js` - SSL/TLS, security middleware
- `backend/utils/hash.js` - Password hashing
- `backend/utils/inputWhitelist.js` - Input validation
- `backend/routes/employee.js` - Employee routes
- `backend/middleware/` - Security middleware

### Frontend
- `frontend/src/components/EmployeeLogin.jsx` - Login form
- `frontend/src/components/EmployeeDashboard.jsx` - Dashboard
- `frontend/src/components/EmployeeProfile.jsx` - Admin profile

### DevSecOps
- `.circleci/config.yml` - CircleCI pipeline
- `sonar-project.properties` - SonarQube configuration
- `.github/workflows/security.yml` - GitHub Actions security

## Common Issues to Avoid

1. **Don't show sensitive data** - Mask passwords and tokens
2. **Don't skip security features** - Show all protections
3. **Don't rush** - Take time to explain each feature
4. **Don't forget to show the backend** - Demonstrate server-side security
5. **Don't ignore errors** - Show how errors are handled

## Success Criteria

Your demonstration should show:
- ✅ All security requirements are met
- ✅ Employee portal functions correctly
- ✅ DevSecOps pipeline is configured
- ✅ Password security is properly implemented
- ✅ Input validation is comprehensive
- ✅ SSL/TLS is enforced
- ✅ All attack protections are in place

## Additional Notes

- The video should be professional and clear
- Focus on security features as they carry the most marks
- Demonstrate the complete workflow from admin to employee
- Show both frontend and backend security implementations
- Highlight the research and additional features you've implemented
