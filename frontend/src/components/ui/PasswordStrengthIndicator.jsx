import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, AlertTriangle, Check, X } from 'lucide-react';

const PasswordStrengthIndicator = ({ password, showRequirements = true }) => {
  const [strength, setStrength] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [requirements, setRequirements] = useState([
    { regex: /.{12,}/, text: 'At least 12 characters', met: false },
    { regex: /[A-Z]/, text: 'One uppercase letter', met: false },
    { regex: /[a-z]/, text: 'One lowercase letter', met: false },
    { regex: /\d/, text: 'One number', met: false },
    { regex: /[!@#$%^&*(),.?":{}|<>]/, text: 'One special character', met: false },
  ]);

  useEffect(() => {
    if (!password) {
      setStrength(0);
      setFeedback('');
      setRequirements([
        { regex: /.{12,}/, text: 'At least 12 characters', met: false },
        { regex: /[A-Z]/, text: 'One uppercase letter', met: false },
        { regex: /[a-z]/, text: 'One lowercase letter', met: false },
        { regex: /\d/, text: 'One number', met: false },
        { regex: /[!@#$%^&*(),.?":{}|<>]/, text: 'One special character', met: false },
      ]);
      return;
    }

    let score = 0;
    const updatedRequirements = [
      { regex: /.{12,}/, text: 'At least 12 characters', met: /.{12,}/.test(password) },
      { regex: /[A-Z]/, text: 'One uppercase letter', met: /[A-Z]/.test(password) },
      { regex: /[a-z]/, text: 'One lowercase letter', met: /[a-z]/.test(password) },
      { regex: /\d/, text: 'One number', met: /\d/.test(password) },
      { regex: /[!@#$%^&*(),.?":{}|<>]/, text: 'One special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];

    // Calculate strength score
    updatedRequirements.forEach(req => {
      if (req.met) score += 20;
    });

    // Bonus for length
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 10;

    // Penalty for common patterns
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
    if (/123|abc|qwe|password/i.test(password)) score -= 15; // Common sequences

    score = Math.max(0, Math.min(100, score));
    setStrength(score);

    // Set feedback based on strength
    if (score < 30) {
      setFeedback('Weak password - add more complexity');
    } else if (score < 60) {
      setFeedback('Fair password - could be stronger');
    } else if (score < 80) {
      setFeedback('Good password - getting stronger');
    } else {
      setFeedback('Strong password - excellent!');
    }

    // Update requirements state
    setRequirements(updatedRequirements);
  }, [password]);

  const getStrengthColor = () => {
    if (strength < 30) return 'error';
    if (strength < 60) return 'warning';
    if (strength < 80) return 'primary';
    return 'success';
  };

  const getStrengthGradient = () => {
    const colors = {
      error: 'bg-gradient-to-r from-error-500 to-error-600',
      warning: 'bg-gradient-to-r from-warning-500 to-warning-600', 
      primary: 'bg-gradient-to-r from-primary-500 to-primary-600',
      success: 'bg-gradient-to-r from-success-500 to-success-600'
    };
    return colors[getStrengthColor()];
  };

  const getStrengthIcon = () => {
    if (strength < 30) return AlertTriangle;
    if (strength < 60) return Shield;
    return ShieldCheck;
  };

  const StrengthIcon = getStrengthIcon();

  return (
    <div className="space-y-3 animate-slide-up">
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StrengthIcon 
              size={16} 
              className={`text-${getStrengthColor()}-600 transition-colors duration-300`}
            />
            <span className={`text-sm font-medium text-${getStrengthColor()}-700 transition-colors duration-300`}>
              Password Strength
            </span>
          </div>
          <span className={`text-sm font-semibold text-${getStrengthColor()}-700 transition-colors duration-300`}>
            {feedback}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="relative h-2 bg-secondary-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getStrengthGradient()} transition-all duration-500 ease-out rounded-full relative overflow-hidden`}
            style={{ width: `${strength}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>
        
        {/* Strength Labels */}
        <div className="flex justify-between text-xs text-secondary-500">
          <span>Weak</span>
          <span>Fair</span>
          <span>Good</span>
          <span>Strong</span>
        </div>
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <div className="space-y-2 p-4 bg-secondary-50/50 rounded-xl border border-secondary-200">
          <h4 className="text-sm font-semibold text-secondary-700 mb-3 flex items-center gap-2">
            <Shield size={14} />
            Password Requirements:
          </h4>
          <div className="space-y-2">
            {requirements.map((requirement, index) => (
              <div 
                key={index}
                className={`flex items-center gap-2 text-sm transition-all duration-300 ${
                  requirement.met ? 'text-success-700' : 'text-secondary-500'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  requirement.met 
                    ? 'bg-success-600 border-success-600' 
                    : 'border-secondary-300'
                }`}>
                  {requirement.met && (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className={requirement.met ? 'font-medium' : ''}>
                  {requirement.text}
                </span>
              </div>
            ))}
          </div>
          
          {/* Additional Tips */}
          <div className="mt-3 pt-3 border-t border-secondary-200">
            <p className="text-xs text-secondary-500 italic">
              Tip: Avoid common words, repeated characters, or personal information
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
