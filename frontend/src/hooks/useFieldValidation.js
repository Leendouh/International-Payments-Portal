import { useState, useCallback, useRef } from 'react';
import validationService from '../services/validation';

/**
 * Real-time Field Validation Hook
 * Provides real-time validation for form fields on blur
 */
export const useFieldValidation = () => {
  const [fieldErrors, setFieldErrors] = useState({});
  const [validatingFields, setValidatingFields] = useState({});
  const validationCache = useRef(new Map());

  const validateField = useCallback(async (fieldName, value, additionalData = null) => {
    // Don't validate empty fields (unless required)
    if (!value || value.trim().length === 0) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: `${fieldName} is required` }));
      setValidatingFields(prev => ({ ...prev, [fieldName]: false }));
      return { valid: false, error: `${fieldName} is required` };
    }

    // Set validating state
    setValidatingFields(prev => ({ ...prev, [fieldName]: true }));
    
    try {
      let result;
      
      switch (fieldName) {
        case 'fullName':
          result = await validationService.validateFullName(value);
          break;
        case 'email':
          result = await validationService.validateEmail(value);
          break;
        case 'loginEmail':
          result = await validationService.validateLoginEmail(value);
          break;
        case 'idNumber':
          result = await validationService.validateRSAId(value);
          break;
        case 'accountNumber':
          result = await validationService.validateLoginAccountNumber(value);
          break;
        case 'password':
          result = await validationService.validatePassword(value, additionalData);
          break;
        case 'loginPassword':
          result = await validationService.validateLoginPassword(value);
          break;
        case 'confirmPassword':
          result = await validationService.validatePassword(additionalData, value);
          break;
        default:
          result = { valid: true };
      }

      // Update error state
      if (result.valid) {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      } else {
        setFieldErrors(prev => ({ ...prev, [fieldName]: result.error }));
      }

      // Cache the result
      validationCache.current.set(`${fieldName}_${value}`, result);
      
      return result;
    } catch (error) {
      console.error(`Validation error for ${fieldName}:`, error);
      const errorResult = { valid: false, error: 'Validation failed' };
      setFieldErrors(prev => ({ ...prev, [fieldName]: errorResult.error }));
      return errorResult;
    } finally {
      setValidatingFields(prev => ({ ...prev, [fieldName]: false }));
    }
  }, []);

  const clearFieldError = useCallback((fieldName) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
    setValidatingFields({});
  }, []);

  const getFieldError = useCallback((fieldName) => {
    return fieldErrors[fieldName] || null;
  }, [fieldErrors]);

  const isFieldValidating = useCallback((fieldName) => {
    return validatingFields[fieldName] || false;
  }, [validatingFields]);

  const isFieldValid = useCallback((fieldName) => {
    return !fieldErrors[fieldName];
  }, [fieldErrors]);

  const hasErrors = useCallback(() => {
    return Object.keys(fieldErrors).length > 0;
  }, [fieldErrors]);

  // Debounced validation for rapid typing
  const debouncedValidateField = useCallback((fieldName, value, additionalData = null, delay = 500) => {
    const cacheKey = `${fieldName}_${value}`;
    
    // Return cached result if available
    if (validationCache.current.has(cacheKey)) {
      const result = validationCache.current.get(cacheKey);
      if (result.valid) {
        clearFieldError(fieldName);
      } else {
        setFieldErrors(prev => ({ ...prev, [fieldName]: result.error }));
      }
      return result;
    }

    // Clear existing timer
    const existingTimer = validationCache.current.get(`timer_${cacheKey}`);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      validateField(fieldName, value, additionalData);
      validationCache.current.delete(`timer_${cacheKey}`);
    }, delay);

    validationCache.current.set(`timer_${cacheKey}`, timer);
  }, [validateField, clearFieldError]);

  return {
    fieldErrors,
    validatingFields,
    validateField,
    debouncedValidateField,
    clearFieldError,
    clearAllErrors,
    getFieldError,
    isFieldValidating,
    isFieldValid,
    hasErrors
  };
};

export default useFieldValidation;
