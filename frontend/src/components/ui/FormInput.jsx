import React, { forwardRef } from 'react';
import { Eye, EyeOff, Lock, Mail, User, CreditCard, Globe } from 'lucide-react';

const FormInput = forwardRef(({
  type = 'text',
  label,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  containerClassName = '',
  icon,
  showPasswordToggle = false,
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  id,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;
  
  const baseInputClasses = `
    w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 rounded-xl
    transition-all duration-300 ease-out
    placeholder:text-secondary-400
    focus:outline-none focus:ring-2 focus:ring-offset-0
    disabled:opacity-50 disabled:cursor-not-allowed
    ${icon ? 'pl-12' : 'pl-4'}
    ${showPasswordToggle ? 'pr-12' : 'pr-4'}
  `;

  const stateClasses = error
    ? 'border-error-300 text-error-900 focus:border-error-500 focus:ring-error-500/20 bg-error-50/50'
    : isFocused
    ? 'border-primary-500 text-secondary-900 focus:border-primary-600 focus:ring-primary-500/20 bg-primary-50/30 shadow-glow'
    : 'border-secondary-200 text-secondary-900 hover:border-secondary-300 hover:bg-white/90';

  const iconComponents = {
    email: Mail,
    password: Lock,
    user: User,
    account: CreditCard,
    currency: Globe,
  };

  const IconComponent = iconComponents[icon];

  return (
    <div className={`relative ${containerClassName}`}>
      {label && (
        <label 
          htmlFor={id}
          className={`
            block text-sm font-semibold mb-2 transition-colors duration-200
            ${error ? 'text-error-700' : isFocused ? 'text-primary-700' : 'text-secondary-700'}
          `}
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {IconComponent && (
          <div className={`
            absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 z-10 pointer-events-none
            ${error ? 'text-error-500' : isFocused ? 'text-primary-500' : 'text-secondary-400'}
          `}>
            <IconComponent size={20} strokeWidth={2} />
          </div>
        )}

        <input
          ref={ref}
          type={inputType}
          id={id}
          value={value}
          onChange={onChange}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`${baseInputClasses} ${stateClasses} ${className}`}
          {...props}
        />

        {type === 'password' && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`
              absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg
              transition-all duration-200 hover:bg-secondary-100/50 focus:outline-none
              focus:ring-2 focus:ring-primary-500/20
              ${error ? 'text-error-500 hover:text-error-600' : 'text-secondary-400 hover:text-secondary-600'}
            `}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff size={18} strokeWidth={2} />
            ) : (
              <Eye size={18} strokeWidth={2} />
            )}
          </button>
        )}
      </div>

      {(error || helperText) && (
        <div className="mt-2 animate-slide-up">
          {error && (
            <p className="text-sm font-medium text-error-600 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
          {!error && helperText && (
            <p className="text-sm text-secondary-500 italic">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';

export const EmailInput = (props) => (
  <FormInput 
    type="email" 
    icon="email"
    placeholder="you@example.com"
    {...props} 
  />
);

export const PasswordInput = (props) => (
  <FormInput 
    type="password" 
    icon="password"
    showPasswordToggle={true}
    placeholder="Enter your password"
    {...props} 
  />
);

export const NameInput = (props) => (
  <FormInput 
    type="text" 
    icon="user"
    placeholder="John Doe"
    {...props} 
  />
);

export const AccountInput = (props) => (
  <FormInput 
    type="text" 
    icon="account"
    placeholder="1234567890"
    {...props} 
  />
);

export default FormInput;
