import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFieldValidation } from '../hooks/useFieldValidation';
import { EmailInput, PasswordInput, AccountInput } from './ui/FormInput';
import { AuthError, SuccessMessage, InfoMessage, ValidationError } from './ui/ErrorMessage';
import { AlertCircle, Shield, Eye, EyeOff, LogIn, UserPlus, Loader2 } from 'lucide-react';
import Footer from './Footer';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    accountNumber: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Real-time field validation
  const {
    fieldErrors: realtimeErrors,
    validatingFields,
    validateField,
    clearFieldError,
    getFieldError,
    isFieldValidating,
    isFieldValid
  } = useFieldValidation();

  // Show success message if redirected from registration
  React.useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear the state to prevent showing again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear real-time error when user starts typing
    if (realtimeErrors[name]) {
      clearFieldError(name);
    }
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Real-time validation on blur (when user leaves field)
  const handleFieldBlur = async (fieldName) => {
    const value = formData[fieldName];
    
    // Don't validate empty fields (unless required)
    if (!value || value.trim().length === 0) {
      return;
    }

    // Map login field names to validation service names
    const validationFieldName = fieldName === 'email' ? 'loginEmail' : 
                               fieldName === 'password' ? 'loginPassword' : 
                               fieldName;

    await validateField(validationFieldName, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation for empty fields
    if (!formData.email || !formData.password || !formData.accountNumber) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      await login(formData);
      setSuccess('Login successful! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      // Display generic error message for security
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-center px-4 py-8 min-h-screen">
      
      <div className="relative w-full max-w-xl">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-strong mb-4">
            <Shield className="text-white" size={40} strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">
            International Payments Portal
          </h1>
          <p className="text-secondary-600">
            Secure access to your payment account
          </p>
        </div>

        {/* Login Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success Message */}
            {success && (
              <SuccessMessage 
                message={success}
                onClose={() => setSuccess('')}
              />
            )}

            {/* Error Message */}
            {error && (
              <AuthError 
                message={error}
                onClose={() => setError('')}
              />
            )}

            {/* Security Notice */}
            <InfoMessage 
              message="For your security, we use generic error messages to protect your account information."
            />

            {/* Email Input */}
            <div className="relative">
              <EmailInput
                id="email"
                name="email"
                label="Email Address"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleFieldBlur('loginEmail')}
                required
                placeholder="you@example.com"
                disabled={loading}
                error={getFieldError('loginEmail')}
              />
              {isFieldValidating('loginEmail') && (
                <div className="absolute right-3 top-9">
                  <Loader2 size={16} className="animate-spin text-primary-500" />
                </div>
              )}
              {getFieldError('loginEmail') && (
                <ValidationError message={getFieldError('loginEmail')} />
              )}
            </div>

            {/* Password Input */}
            <div className="relative">
              <PasswordInput
                id="password"
                name="password"
                label="Password"
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleFieldBlur('loginPassword')}
                required
                placeholder="Enter your password"
                disabled={loading}
                error={getFieldError('loginPassword')}
                showPasswordToggle
              />
              {isFieldValidating('loginPassword') && (
                <div className="absolute right-12 top-9">
                  <Loader2 size={16} className="animate-spin text-primary-500" />
                </div>
              )}
              {getFieldError('loginPassword') && (
                <ValidationError message={getFieldError('loginPassword')} />
              )}
            </div>

            {/* Account Number Input */}
            <div className="relative">
              <AccountInput
                id="accountNumber"
                name="accountNumber"
                label="Account Number"
                value={formData.accountNumber}
                onChange={handleChange}
                onBlur={() => handleFieldBlur('accountNumber')}
                required
                placeholder="1234567890"
                disabled={loading}
                error={getFieldError('accountNumber')}
                helperText="Enter your 8-12 digit account number"
              />
              {isFieldValidating('accountNumber') && (
                <div className="absolute right-3 top-9">
                  <Loader2 size={16} className="animate-spin text-primary-500" />
                </div>
              )}
              {getFieldError('accountNumber') && (
                <ValidationError message={getFieldError('accountNumber')} />
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center text-base font-semibold py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="loading-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={20} strokeWidth={2} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-secondary-200">
            <div className="text-center space-y-4">
              <p className="text-secondary-600 text-sm">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-200"
                >
                  Create Account
                </Link>
              </p>
              
              <div className="mt-4 pt-4 border-t border-secondary-200">
                <Link 
                  to="/employee/login" 
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  <Shield size={18} />
                  Employee Portal
                </Link>
              </div>
              
              <div className="flex items-center justify-center gap-6 text-xs text-secondary-500 mt-4">
                <a href="#" className="hover:text-secondary-700 transition-colors">
                  Forgot Password?
                </a>
                <a href="#" className="hover:text-secondary-700 transition-colors">
                  Help Center
                </a>
                <a href="#" className="hover:text-secondary-700 transition-colors">
                  Security
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-success-50 border border-success-200 rounded-full">
            <Shield size={16} className="text-success-600" />
            <span className="text-xs font-medium text-success-700">
              Bank-Level Security
            </span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Login;
