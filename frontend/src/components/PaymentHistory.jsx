import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  DollarSign, 
  Globe, 
  Shield, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send
} from 'lucide-react';
import Footer from './Footer';

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10
  });

  useEffect(() => {
    fetchPayments();
  }, [pagination.currentPage]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await paymentAPI.getPayments(pagination.currentPage, pagination.limit);
      setPayments(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        icon: Clock,
        color: 'warning',
        label: 'Pending'
      },
      approved: {
        icon: CheckCircle,
        color: 'success',
        label: 'Approved'
      },
      rejected: {
        icon: XCircle,
        color: 'error',
        label: 'Rejected'
      },
      processed: {
        icon: CheckCircle,
        color: 'primary',
        label: 'Processed'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-${config.color}-50 border border-${config.color}-200`}>
        <Icon size={14} className={`text-${config.color}-600`} />
        <span className={`text-xs font-medium text-${config.color}-700`}>
          {config.label}
        </span>
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-secondary-600 font-medium">Loading payment history...</p>
          </div>
        </div>
      </div>
    );
  }

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
            <FileText size={24} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Payment History
            </h1>
            <p className="text-secondary-600">
              Track all your international payments and their status
            </p>
          </div>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText size={40} className="text-secondary-400" />
          </div>
          <h3 className="text-xl font-semibold text-secondary-900 mb-3">No payments yet</h3>
          <p className="text-secondary-600 mb-8 max-w-md mx-auto">
            You haven't made any international payments yet. Create your first payment to get started.
          </p>
          <button
            onClick={() => navigate('/payment')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Send size={20} />
            Create Your First Payment
          </button>
        </div>
      ) : (
        <>
          {/* Payment Cards */}
          <div className="space-y-4 mb-8">
            {payments.map((payment) => (
              <div key={payment.id} className="card p-6 hover:shadow-strong transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      payment.status === 'pending' ? 'bg-warning-50' :
                      payment.status === 'approved' ? 'bg-success-50' :
                      payment.status === 'processed' ? 'bg-primary-50' :
                      'bg-error-50'
                    }`}>
                      {payment.status === 'pending' ? (
                        <Clock size={20} className="text-warning-600" />
                      ) : payment.status === 'approved' ? (
                        <CheckCircle size={20} className="text-success-600" />
                      ) : payment.status === 'processed' ? (
                        <CheckCircle size={20} className="text-primary-600" />
                      ) : (
                        <XCircle size={20} className="text-error-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900 mb-1">
                        {payment.currency} {parseFloat(payment.amount).toLocaleString()}
                      </h3>
                      <p className="text-sm text-secondary-600 flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(payment.created_at)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(payment.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Globe size={16} className="text-secondary-400" />
                    <div>
                      <p className="text-xs text-secondary-500 mb-1">Recipient Account</p>
                      <p className="text-sm font-mono text-secondary-900">
                        {payment.recipient_account}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-secondary-400" />
                    <div>
                      <p className="text-xs text-secondary-500 mb-1">SWIFT/BIC Code</p>
                      <p className="text-sm font-mono text-secondary-900">
                        {payment.swift_bic}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced Pagination */}
          {pagination.totalPages > 1 && (
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-secondary-600">
                  Showing <span className="font-medium text-secondary-900">
                    {((pagination.currentPage - 1) * pagination.limit) + 1}
                  </span> to{' '}
                  <span className="font-medium text-secondary-900">
                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)}
                  </span> of{' '}
                  <span className="font-medium text-secondary-900">
                    {pagination.totalCount}
                  </span> results
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-secondary-300 bg-white/80 text-secondary-700 font-medium hover:bg-secondary-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  
                  <div className="px-4 py-2 bg-primary-50 border border-primary-200 rounded-xl">
                    <span className="text-sm font-medium text-primary-700">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-secondary-300 bg-white/80 text-secondary-700 font-medium hover:bg-secondary-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Status Information Card */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 bg-gradient-to-br from-primary-50 to-blue-100 border-primary-200">
          <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-primary-600" />
            Payment Status Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Clock size={16} className="text-warning-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-secondary-900">Pending</p>
                <p className="text-xs text-secondary-600">Payment is awaiting employee approval</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={16} className="text-success-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-secondary-900">Approved</p>
                <p className="text-xs text-secondary-600">Payment has been approved and is being processed</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={16} className="text-primary-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-secondary-900">Processed</p>
                <p className="text-xs text-secondary-600">Payment has been completed successfully</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <XCircle size={16} className="text-error-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-secondary-900">Rejected</p>
                <p className="text-xs text-secondary-600">Payment was rejected during review</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-success-50 to-emerald-100 border-success-200">
          <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <Shield size={20} className="text-success-600" />
            Security & Compliance
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle size={16} className="text-success-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-secondary-900">256-bit Encryption</p>
                <p className="text-xs text-secondary-600">All transactions are encrypted end-to-end</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={16} className="text-success-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-secondary-900">HMAC Verification</p>
                <p className="text-xs text-secondary-600">Digital signatures ensure transaction integrity</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={16} className="text-success-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-secondary-900">SWIFT Network</p>
                <p className="text-xs text-secondary-600">Bank-level security for international transfers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <Footer />
  </div>
  );
};

export default PaymentHistory;
