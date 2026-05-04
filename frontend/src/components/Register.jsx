import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFieldValidation } from '../hooks/useFieldValidation';
import { EmailInput, PasswordInput, NameInput, AccountInput } from './ui/FormInput';
import { AuthError, SuccessMessage, ValidationError, InfoMessage } from './ui/ErrorMessage';
import PasswordStrengthIndicator from './ui/PasswordStrengthIndicator';
import { Shield, UserPlus, CheckCircle, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import Footer from './Footer';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    idNumber: '',
    accountNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false
  });
  
  const { register } = useAuth();
  const navigate = useNavigate();
  
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

  const validateForm = () => {
    const newErrors = {};

    // Full Name validation - completely handled by real-time validation
    // Real-time validation handles both required and format checking

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // ID Number validation (South African)
    if (!formData.idNumber.trim()) {
      newErrors.idNumber = 'ID number is required';
    } else if (!/^\d{13}$/.test(formData.idNumber)) {
      newErrors.idNumber = 'ID number must be exactly 13 digits';
    } else {
      // Luhn algorithm for SA ID validation
      const id = formData.idNumber.replace(/\s/g, '');
      let sum = 0;
      let alternate = false;
      
      for (let i = id.length - 1; i >= 0; i--) {
        let digit = parseInt(id.charAt(i), 10);
        
        if (alternate) {
          digit *= 2;
          if (digit > 9) digit = (digit % 10) + 1;
        }
        
        sum += digit;
        alternate = !alternate;
      }
      
      if (sum % 10 !== 0) {
        newErrors.idNumber = 'Invalid South African ID number';
      }
    }

    // Account Number validation
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!/^\d{6,16}$/.test(formData.accountNumber)) {
      newErrors.accountNumber = 'Account number must be 6-16 digits';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 12) {
      newErrors.password = 'Password must be at least 12 characters';
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear real-time error when user starts typing
    if (realtimeErrors[name]) {
      clearFieldError(name);
    }
    
    // Clear general error when user starts typing
    if (error) setError('');
  };

  // Real-time validation on blur (when user leaves field)
  const handleFieldBlur = async (fieldName) => {
    const value = formData[fieldName];
    
    // Don't validate empty fields (unless required)
    if (!value || value.trim().length === 0) {
      return;
    }

    let additionalData = null;
    
    // For confirm password, pass the original password
    if (fieldName === 'confirmPassword') {
      additionalData = formData.password;
    }
    
    // For password, pass confirm password for matching
    if (fieldName === 'password' && formData.confirmPassword) {
      additionalData = formData.confirmPassword;
    }

    await validateField(fieldName, value, additionalData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fix the errors below and try again.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { confirmPassword, ...registrationData } = formData;
      const response = await register(registrationData);
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Registration successful! Please sign in to your new account.' 
          } 
        });
      }, 2000);
    } catch (error) {
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-center px-4 py-8 min-h-screen">
      
      <div className="relative w-full max-w-4xl">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl shadow-strong mb-4">
            <UserPlus className="text-white" size={40} strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">
            Create Account
          </h1>
          <p className="text-secondary-600">
            Join the International Payments Portal
          </p>
        </div>

        {/* Registration Form */}
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
              message="Your information is protected with bank-level security and encryption."
            />

            {/* Two Column Layout for Personal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name Input */}
              <div className="relative">
                <NameInput
                  id="fullName"
                  name="fullName"
                  label="Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={() => handleFieldBlur('fullName')}
                  required
                  placeholder="John Doe"
                  disabled={loading}
                  error={null}
                />
                {isFieldValidating('fullName') && (
                  <div className="absolute right-3 top-9">
                    <Loader2 size={16} className="animate-spin text-primary-500" />
                  </div>
                )}
                {getFieldError('fullName') && !errors.fullName && (
                  <ValidationError message={getFieldError('fullName')} />
                )}
              </div>

              {/* Email Input */}
              <div className="relative">
                <EmailInput
                  id="email"
                  name="email"
                  label="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleFieldBlur('email')}
                  required
                  placeholder="you@example.com"
                  disabled={loading}
                  error={errors.email || getFieldError('email')}
                />
                {isFieldValidating('email') && (
                  <div className="absolute right-3 top-9">
                    <Loader2 size={16} className="animate-spin text-primary-500" />
                  </div>
                )}
                {getFieldError('email') && !errors.email && (
                  <ValidationError message={getFieldError('email')} />
                )}
              </div>
            </div>

            {/* Two Column Layout for ID and Account Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ID Number Input */}
              <div className="relative">
                <label className="block text-sm font-semibold mb-2 text-secondary-700">
                  South African ID Number
                  <span className="text-error-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="idNumber"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleChange}
                    onBlur={() => handleFieldBlur('idNumber')}
                    required
                    placeholder="9001015009087"
                    disabled={loading}
                    maxLength={13}
                    className={`
                      w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 rounded-xl
                      transition-all duration-300 ease-out
                      placeholder:text-secondary-400
                      focus:outline-none focus:ring-2 focus:ring-offset-0
                      disabled:opacity-50 disabled:cursor-not-allowed
                      pl-12 pr-12
                      ${(errors.idNumber || getFieldError('idNumber'))
                        ? 'border-error-300 text-error-900 focus:border-error-500 focus:ring-error-500/20 bg-error-50/50' 
                        : 'border-secondary-200 text-secondary-900 hover:border-secondary-300 hover:bg-white/90 focus:border-primary-500 focus:ring-primary-500/20'
                      }
                    `}
                  />
                  {isFieldValidating('idNumber') && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 size={16} className="animate-spin text-primary-500" />
                    </div>
                  )}
                  <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                    errors.idNumber ? 'text-error-500' : 'text-secondary-400'
                  }`}>
                    <UserPlus size={20} strokeWidth={2} />
                  </div>
                </div>
                {(errors.idNumber || getFieldError('idNumber')) && (
                  <ValidationError message={errors.idNumber || getFieldError('idNumber')} />
                )}
                <p className="mt-2 text-xs text-secondary-500 italic">
                  Enter your 13-digit South African ID number
                </p>
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
                  error={errors.accountNumber || getFieldError('accountNumber')}
                  helperText="Enter your 10-12 digit bank account number"
                />
                {isFieldValidating('accountNumber') && (
                  <div className="absolute right-3 top-9">
                    <Loader2 size={16} className="animate-spin text-primary-500" />
                  </div>
                )}
                {getFieldError('accountNumber') && !errors.accountNumber && (
                  <ValidationError message={getFieldError('accountNumber')} />
                )}
              </div>
            </div>

            {/* Two Column Layout for Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password Input */}
              <div className="space-y-3">
                <div className="relative">
                  <PasswordInput
                    id="password"
                    name="password"
                    label="Password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleFieldBlur('password')}
                    required
                    placeholder="Create a strong password"
                    disabled={loading}
                    error={errors.password || getFieldError('password')}
                    showPasswordToggle
                  />
                  {isFieldValidating('password') && (
                    <div className="absolute right-12 top-9">
                      <Loader2 size={16} className="animate-spin text-primary-500" />
                    </div>
                  )}
                </div>
                {getFieldError('password') && !errors.password && (
                  <ValidationError message={getFieldError('password')} />
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="relative">
                <label className="block text-sm font-semibold mb-2 text-secondary-700">
                  Confirm Password
                  <span className="text-error-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => handleFieldBlur('confirmPassword')}
                    required
                    placeholder="Confirm your password"
                    disabled={loading}
                    className={`
                      w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 rounded-xl
                      transition-all duration-300 ease-out
                      placeholder:text-secondary-400
                      focus:outline-none focus:ring-2 focus:ring-offset-0
                      disabled:opacity-50 disabled:cursor-not-allowed
                      pl-12 pr-20
                      ${(errors.confirmPassword || getFieldError('confirmPassword'))
                        ? 'border-error-300 text-error-900 focus:border-error-500 focus:ring-error-500/20 bg-error-50/50' 
                        : 'border-secondary-200 text-secondary-900 hover:border-secondary-300 hover:bg-white/90 focus:border-primary-500 focus:ring-primary-500/20'
                      }
                    `}
                  />
                  <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                    (errors.confirmPassword || getFieldError('confirmPassword')) ? 'text-error-500' : 'text-secondary-400'
                  }`}>
                    <Shield size={20} strokeWidth={2} />
                  </div>
                  {isFieldValidating('confirmPassword') && (
                    <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                      <Loader2 size={16} className="animate-spin text-primary-500" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    className={`
                      absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg
                      transition-all duration-200 hover:bg-secondary-100/50 focus:outline-none
                      focus:ring-2 focus:ring-primary-500/20
                      ${(errors.confirmPassword || getFieldError('confirmPassword')) ? 'text-error-500 hover:text-error-600' : 'text-secondary-400 hover:text-secondary-600'}
                    `}
                    disabled={loading}
                  >
                    {showPasswords.confirmPassword ? (
                      <EyeOff size={18} strokeWidth={2} />
                    ) : (
                      <Eye size={18} strokeWidth={2} />
                    )}
                  </button>
                </div>
                {(errors.confirmPassword || getFieldError('confirmPassword')) && (
                  <ValidationError message={errors.confirmPassword || getFieldError('confirmPassword')} />
                )}
              </div>
            </div>

            {/* Password Strength Indicator - Full Width */}
            {formData.password && (
              <PasswordStrengthIndicator 
                password={formData.password} 
                showRequirements={true}
              />
            )}

            {/* Terms and Conditions */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  className="mt-1 w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500 focus:ring-2"
                  disabled={loading}
                />
                <span className="text-sm text-secondary-600 leading-relaxed">
                  I agree to the{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                    Privacy Policy
                  </a>
                </span>
              </label>
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
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={20} strokeWidth={2} />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-secondary-200">
            <div className="text-center space-y-4">
              <p className="text-secondary-600 text-sm">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-200"
                >
                  Sign In
                </Link>
              </p>
              
              <div className="flex items-center justify-center gap-6 text-xs text-secondary-500">
                <a href="#" className="hover:text-secondary-700 transition-colors">
                  Help Center
                </a>
                <a href="#" className="hover:text-secondary-700 transition-colors">
                  Security
                </a>
                <a href="#" className="hover:text-secondary-700 transition-colors">
                  Contact Us
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
              256-bit Encryption Protection
            </span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Register;
