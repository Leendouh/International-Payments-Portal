import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { paymentAPI } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Globe, CreditCard, Shield, AlertCircle, Send, CheckCircle } from 'lucide-react';
import Footer from './Footer';

const PaymentForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [providers, setProviders] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      currency: 'ZAR',
      provider: 'SWIFT'
    }
  });

  useEffect(() => {
    fetchCurrencies();
    fetchProviders();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const response = await paymentAPI.getCurrencies();
      setCurrencies(response.data.currencies);
    } catch (error) {
      console.error('Failed to fetch currencies:', error);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await paymentAPI.getProviders();
      setProviders(response.data.providers);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  };

  const validateAmount = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return 'Amount must be a valid number';
    }
    if (num < 0.01) {
      return 'Amount must be at least 0.01';
    }
    if (num > 1000000) {
      return 'Amount cannot exceed 1,000,000';
    }
    if (!/^\d+(\.\d{1,2})?$/.test(value)) {
      return 'Amount can have at most 2 decimal places';
    }
    return true;
  };

  const validateSwiftBic = (value) => {
    if (!/^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test(value)) {
      return 'SWIFT/BIC code must be 8 or 11 alphanumeric characters';
    }
    return true;
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await paymentAPI.createPayment(data);
      toast.success('Payment initiated successfully!');
      navigate('/history');
    } catch (error) {
      // Display generic error message for security
      toast.error('Payment failed. Please check your information and try again.');
      console.error('Payment creation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg">
            <Send size={24} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Send International Payment
            </h1>
            <p className="text-secondary-600">
              Initiate secure international transfers with SWIFT network
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="card p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Amount and Currency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-secondary-700 mb-2">
                    Amount
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="amount"
                      {...register('amount', {
                        required: 'Amount is required',
                        validate: validateAmount,
                      })}
                      className={`w-full px-4 py-3 bg-white/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                        errors.amount ? 'border-error-500 bg-error-50' : 'border-secondary-200'
                      }`}
                      placeholder="1000.00"
                    />
                    <CreditCard size={20} className="absolute right-3 top-3.5 text-secondary-400" />
                  </div>
                  {errors.amount && (
                    <p className="mt-2 text-sm text-error-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.amount.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-secondary-700 mb-2">
                    Currency
                  </label>
                  <div className="relative">
                    <select
                      id="currency"
                      {...register('currency', {
                        required: 'Currency is required',
                      })}
                      className={`w-full px-4 py-3 bg-white/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none ${
                        errors.currency ? 'border-error-500 bg-error-50' : 'border-secondary-200'
                      }`}
                    >
                      {currencies.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                    <Globe size={20} className="absolute right-3 top-3.5 text-secondary-400 pointer-events-none" />
                  </div>
                  {errors.currency && (
                    <p className="mt-2 text-sm text-error-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.currency.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Provider */}
              <div>
                <label htmlFor="provider" className="block text-sm font-medium text-secondary-700 mb-2">
                  Payment Provider
                </label>
                <div className="relative">
                  <select
                    id="provider"
                    {...register('provider', {
                      required: 'Provider is required',
                    })}
                    className={`w-full px-4 py-3 bg-white/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none ${
                      errors.provider ? 'border-error-500 bg-error-50' : 'border-secondary-200'
                    }`}
                  >
                    {providers.map((provider) => (
                      <option key={provider.code} value={provider.code}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                  <Shield size={20} className="absolute right-3 top-3.5 text-secondary-400 pointer-events-none" />
                </div>
                {errors.provider && (
                  <p className="mt-2 text-sm text-error-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.provider.message}
                  </p>
                )}
              </div>

              {/* SWIFT/BIC Code */}
              <div>
                <label htmlFor="swiftBic" className="block text-sm font-medium text-secondary-700 mb-2">
                  SWIFT/BIC Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="swiftBic"
                    {...register('swiftBic', {
                      required: 'SWIFT/BIC code is required',
                      validate: validateSwiftBic,
                    })}
                    className={`w-full px-4 py-3 bg-white/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-mono ${
                      errors.swiftBic ? 'border-error-500 bg-error-50' : 'border-secondary-200'
                    }`}
                    placeholder="ABCDZAJJXXX"
                    style={{ textTransform: 'uppercase' }}
                  />
                  <Globe size={20} className="absolute right-3 top-3.5 text-secondary-400" />
                </div>
                {errors.swiftBic && (
                  <p className="mt-2 text-sm text-error-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.swiftBic.message}
                  </p>
                )}
                <p className="mt-2 text-xs text-secondary-500">
                  Enter 8 or 11 character SWIFT/BIC code (e.g., ABCDZAJJXXX)
                </p>
              </div>

              {/* Recipient Account */}
              <div>
                <label htmlFor="recipientAccount" className="block text-sm font-medium text-secondary-700 mb-2">
                  Recipient Account Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="recipientAccount"
                    {...register('recipientAccount', {
                      required: 'Recipient account is required',
                      pattern: {
                        value: /^[A-Za-z0-9\s\-]+$/,
                        message: 'Recipient account can only contain letters, numbers, spaces, and hyphens',
                      },
                      maxLength: {
                        value: 50,
                        message: 'Recipient account must be less than 50 characters',
                      },
                    })}
                    className={`w-full px-4 py-3 bg-white/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-mono ${
                      errors.recipientAccount ? 'border-error-500 bg-error-50' : 'border-secondary-200'
                    }`}
                    placeholder="1234567890123456"
                  />
                  <CreditCard size={20} className="absolute right-3 top-3.5 text-secondary-400" />
                </div>
                {errors.recipientAccount && (
                  <p className="mt-2 text-sm text-error-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.recipientAccount.message}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                    isLoading
                      ? 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Send Payment
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 rounded-xl font-medium border border-secondary-300 bg-white/80 text-secondary-700 hover:bg-secondary-50 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="card p-6 bg-gradient-to-br from-primary-50 to-blue-100 border-primary-200">
            <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
              <CheckCircle size={20} className="text-primary-600" />
              Payment Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-primary-200">
                <span className="text-secondary-600">Amount</span>
                <span className="font-semibold text-secondary-900">
                  {watch('amount') || '0.00'} {watch('currency')}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-primary-200">
                <span className="text-secondary-600">Provider</span>
                <span className="font-semibold text-secondary-900">
                  {watch('provider') || 'Not selected'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-primary-200">
                <span className="text-secondary-600">SWIFT/BIC</span>
                <span className="font-mono text-sm text-secondary-900">
                  {watch('swiftBic') || 'Not entered'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-secondary-600">Recipient</span>
                <span className="font-mono text-sm text-secondary-900">
                  {watch('recipientAccount') || 'Not entered'}
                </span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="card p-6 bg-gradient-to-br from-success-50 to-emerald-100 border-success-200">
            <h3 className="font-semibold text-secondary-900 mb-3 flex items-center gap-2">
              <Shield size={20} className="text-success-600" />
              Bank-Level Security
            </h3>
            <ul className="space-y-2 text-sm text-secondary-700">
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-success-600 mt-0.5 flex-shrink-0" />
                <span>256-bit encryption protects your data</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-success-600 mt-0.5 flex-shrink-0" />
                <span>HMAC signature verification</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-success-600 mt-0.5 flex-shrink-0" />
                <span>SWIFT network security standards</span>
              </li>
            </ul>
          </div>

          {/* Important Notice */}
          <div className="card p-6 bg-gradient-to-br from-warning-50 to-amber-100 border-warning-200">
            <h3 className="font-semibold text-secondary-900 mb-3 flex items-center gap-2">
              <AlertCircle size={20} className="text-warning-600" />
              Important Notice
            </h3>
            <p className="text-sm text-secondary-700 leading-relaxed">
              This is a demonstration system. All payments will be created with "pending" status 
              and require employee approval in a production environment. Do not use real financial information.
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <Footer />
  </div>
  );
};

export default PaymentForm;
