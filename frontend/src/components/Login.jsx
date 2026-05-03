import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { EmailInput, PasswordInput, AccountInput } from './ui/FormInput';
import { AuthError, SuccessMessage, InfoMessage } from './ui/ErrorMessage';
import { AlertCircle, Shield, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
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
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await login(formData);
      setSuccess('Login successful! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
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
            <EmailInput
              id="email"
              name="email"
              label="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              disabled={loading}
            />

            {/* Password Input */}
            <PasswordInput
              id="password"
              name="password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              disabled={loading}
              showPasswordToggle
            />

            {/* Account Number Input */}
            <AccountInput
              id="accountNumber"
              name="accountNumber"
              label="Account Number"
              value={formData.accountNumber}
              onChange={handleChange}
              required
              placeholder="1234567890"
              disabled={loading}
              helperText="Enter your 6-16 digit account number"
            />

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
              
              <div className="flex items-center justify-center gap-6 text-xs text-secondary-500">
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
