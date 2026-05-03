import React from 'react';
import { AlertCircle, X, Shield, AlertTriangle, Info, CheckCircle } from 'lucide-react';

const ErrorMessage = ({ 
  type = 'error', 
  message, 
  onClose, 
  className = '',
  showIcon = true,
  size = 'md',
  animated = true 
}) => {
  const baseClasses = 'relative flex items-start gap-3 p-4 rounded-2xl shadow-soft backdrop-blur-sm transition-all duration-300';
  
  const typeClasses = {
    error: 'bg-gradient-to-r from-error-50 to-error-100 border border-error-200 text-error-800',
    warning: 'bg-gradient-to-r from-warning-50 to-warning-100 border border-warning-200 text-warning-800',
    success: 'bg-gradient-to-r from-success-50 to-success-100 border border-success-200 text-success-800',
    info: 'bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 text-primary-800',
  };

  const sizeClasses = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-base',
    lg: 'p-5 text-lg',
  };

  const iconClasses = {
    error: 'text-error-600',
    warning: 'text-warning-600',
    success: 'text-success-600',
    info: 'text-primary-600',
  };

  const icons = {
    error: AlertCircle,
    warning: AlertTriangle,
    success: CheckCircle,
    info: Info,
  };

  const animationClasses = animated ? 'animate-slide-down' : '';

  const Icon = icons[type] || AlertCircle;

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${sizeClasses[size]} ${animationClasses} ${className}`}>
      {showIcon && (
        <div className={`flex-shrink-0 ${iconClasses[type]} ${animated ? 'animate-bounce-soft' : ''}`}>
          <Icon size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} strokeWidth={2} />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'}`}>
          {message}
        </p>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 p-1 rounded-lg transition-colors duration-200 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${type}-500 ${iconClasses[type]}`}
          aria-label="Dismiss message"
        >
          <X size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} strokeWidth={2} />
        </button>
      )}
    </div>
  );
};

export const ValidationError = ({ field, message, className = '' }) => (
  <ErrorMessage
    type="error"
    message={`${field}: ${message}`}
    size="sm"
    className={`mt-2 ${className}`}
    showIcon
    animated
  />
);

export const AuthError = ({ message, onClose, className = '' }) => (
  <ErrorMessage
    type="error"
    message={message}
    onClose={onClose}
    className={`mb-6 ${className}`}
    showIcon
    size="md"
    animated
  />
);

export const SuccessMessage = ({ message, onClose, className = '' }) => (
  <ErrorMessage
    type="success"
    message={message}
    onClose={onClose}
    className={`mb-4 ${className}`}
    showIcon
    size="md"
    animated
  />
);

export const WarningMessage = ({ message, onClose, className = '' }) => (
  <ErrorMessage
    type="warning"
    message={message}
    onClose={onClose}
    className={`mb-4 ${className}`}
    showIcon
    size="md"
    animated
  />
);

export const InfoMessage = ({ message, onClose, className = '' }) => (
  <ErrorMessage
    type="info"
    message={message}
    onClose={onClose}
    className={`mb-4 ${className}`}
    showIcon
    size="md"
    animated
  />
);

export default ErrorMessage;
