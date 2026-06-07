import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { Shield, LogOut, RefreshCw, CheckCircle, Send, Users, AlertCircle, Clock, XCircle, Eye, X, User } from 'lucide-react';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('employeeToken');
    const employeeData = localStorage.getItem('employee');
    
    if (!token || !employeeData) {
      navigate('/employee/login');
      return;
    }

    setEmployee(JSON.parse(employeeData));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchPendingTransactions();
  }, [navigate]);

  const fetchPendingTransactions = async () => {
    try {
      const response = await api.get('/employee/pending-transactions');
      setTransactions(response.data.transactions);
    } catch (error) {
      toast.error('Failed to fetch pending transactions');
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPendingTransactions();
      toast.success('Transactions refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh transactions');
    }
  };

  const handleVerify = async (transactionId) => {
    try {
      await api.post(`/employee/verify/${transactionId}`);
      toast.success('Transaction verified successfully', {
        icon: <CheckCircle className="text-green-500" />
      });
      fetchPendingTransactions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to verify transaction', {
        icon: <AlertCircle className="text-red-500" />
      });
    }
  };

  const handleSubmitToSwift = async (transactionId) => {
    try {
      await api.post(`/employee/submit/${transactionId}`);
      toast.success('Transaction submitted to SWIFT successfully', {
        icon: <Send className="text-green-500" />
      });
      fetchPendingTransactions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit transaction', {
        icon: <AlertCircle className="text-red-500" />
      });
    }
  };

  const handleReject = async (transactionId) => {
    try {
      await api.post(`/employee/reject/${transactionId}`);
      toast.success('Transaction rejected successfully', {
        icon: <XCircle className="text-red-500" />
      });
      fetchPendingTransactions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject transaction', {
        icon: <AlertCircle className="text-red-500" />
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employee');
    delete api.defaults.headers.common['Authorization'];
    navigate('/employee/login');
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedTransaction(null);
  };

  const pendingCount = transactions.filter(t => t.status === 'pending').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200">
      {/* Header */}
      <header className="bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Shield size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Employee Dashboard</h1>
                <p className="text-sky-100 text-sm">Welcome, {employee?.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => navigate('/employee/profile')}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-all duration-200"
              >
                <User size={18} />
                <span className="hidden sm:inline">Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-all duration-200"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-sky-100 rounded-xl">
                <Clock size={24} className="text-sky-600" />
              </div>
              <span className="text-xs font-medium text-sky-600 bg-sky-50 px-2 py-1 rounded-full">
                Pending
              </span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Pending Transactions</h3>
            <p className="text-4xl font-bold text-gray-900">{pendingCount}</p>
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Users size={24} className="text-purple-600" />
              </div>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full capitalize">
                {employee?.role}
              </span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Your Role</h3>
            <p className="text-2xl font-bold text-gray-900 capitalize">{employee?.role}</p>
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Shield size={24} className="text-green-600" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                ID
              </span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Employee ID</h3>
            <p className="text-2xl font-bold text-gray-900">#{employee?.id}</p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-sky-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-100 rounded-lg">
                  <Clock size={20} className="text-sky-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Pending Transactions</h2>
                  <p className="text-sm text-gray-500">Review and process customer transactions</p>
                </div>
              </div>
              <Link 
                to="/employee/login"
                className="text-sky-600 hover:text-sky-800 text-sm font-medium"
              >
                ← Back to Login
              </Link>
            </div>
          </div>
          
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <CheckCircle size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">All caught up!</h3>
              <p className="text-gray-500">No pending transactions to review at the moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Beneficiary
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      SWIFT Code
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-sky-700">
                              {transaction.customer_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{transaction.customer_name}</div>
                            <div className="text-sm text-gray-500">{transaction.customer_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {transaction.amount} {transaction.currency}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-mono">{transaction.beneficiary_account}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 font-mono">{transaction.swift_bic}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.status === 'pending' && (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                            Pending
                          </span>
                        )}
                        {transaction.status === 'approved' && (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                            Approved
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(transaction)}
                            className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-sm hover:shadow"
                          >
                            <Eye size={16} />
                            <span className="hidden sm:inline">View</span>
                          </button>
                          {transaction.status === 'pending' && (
                            <>
                              {(employee?.role === 'admin' || employee?.role === 'manager') && (
                                <button
                                  onClick={() => handleVerify(transaction.id)}
                                  className="flex items-center gap-1 px-3 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors duration-200 shadow-sm hover:shadow"
                                >
                                  <CheckCircle size={16} />
                                  <span className="hidden sm:inline">Approve</span>
                                </button>
                              )}
                              {employee?.role === 'admin' && (
                                <button
                                  onClick={() => handleReject(transaction.id)}
                                  className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-sm hover:shadow"
                                >
                                  <XCircle size={16} />
                                  <span className="hidden sm:inline">Reject</span>
                                </button>
                              )}
                            </>
                          )}
                          {transaction.status === 'approved' && employee?.role === 'admin' && (
                            <button
                              onClick={() => handleSubmitToSwift(transaction.id)}
                              className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm hover:shadow"
                            >
                              <Send size={16} />
                              <span className="hidden sm:inline">Process</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Transaction Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div className="bg-sky-50 rounded-xl p-4 border border-sky-200">
                <h3 className="text-sm font-semibold text-sky-900 mb-3 flex items-center gap-2">
                  <Users size={16} />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-sky-600 mb-1">Name</p>
                    <p className="text-sm font-medium text-gray-900">{selectedTransaction.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-sky-600 mb-1">Email</p>
                    <p className="text-sm font-medium text-gray-900">{selectedTransaction.customer_email}</p>
                  </div>
                </div>
              </div>

              {/* Transaction Information */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Send size={16} />
                  Transaction Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Transaction ID</p>
                    <p className="text-sm font-medium text-gray-900">#{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Status</p>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedTransaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      selectedTransaction.status === 'approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                      'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Amount</p>
                    <p className="text-sm font-bold text-gray-900">{selectedTransaction.amount} {selectedTransaction.currency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Created At</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedTransaction.created_at).toLocaleString('en-ZA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Beneficiary Information */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <Shield size={16} />
                  Beneficiary Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-xs text-green-600 mb-1">Recipient Account</p>
                    <p className="text-sm font-mono font-medium text-gray-900">{selectedTransaction.beneficiary_account}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 mb-1">SWIFT/BIC Code</p>
                    <p className="text-sm font-mono font-medium text-gray-900">{selectedTransaction.swift_bic}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
