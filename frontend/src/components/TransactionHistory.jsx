import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { Shield, LogOut, RefreshCw, CheckCircle, Send, Users, AlertCircle, Clock, XCircle, Eye, X, User, History, Filter, ArrowLeft } from 'lucide-react';

export default function TransactionHistory() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('employeeToken');
    const employeeData = localStorage.getItem('employee');
    
    if (!token || !employeeData) {
      navigate('/employee/login');
      return;
    }

    setEmployee(JSON.parse(employeeData));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchTransactionHistory();
  }, [navigate, statusFilter]);

  const fetchTransactionHistory = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await api.get('/employee/transaction-history', { params });
      setTransactions(response.data.transactions);
    } catch (error) {
      toast.error('Failed to fetch transaction history');
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchTransactionHistory();
      toast.success('Transaction history refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh transaction history');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} />;
      case 'approved':
        return <CheckCircle size={16} />;
      case 'processed':
        return <Send size={16} />;
      case 'rejected':
        return <XCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const filteredTransactions = statusFilter === 'all' 
    ? transactions 
    : transactions.filter(t => t.status === statusFilter);

  const stats = {
    all: transactions.length,
    pending: transactions.filter(t => t.status === 'pending').length,
    approved: transactions.filter(t => t.status === 'approved').length,
    processed: transactions.filter(t => t.status === 'processed').length,
    rejected: transactions.filter(t => t.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transaction history...</p>
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
                <History size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Transaction History</h1>
                <p className="text-sky-100 text-sm">View all processed transactions</p>
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
                onClick={() => navigate('/employee/dashboard')}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-all duration-200"
              >
                <Shield size={18} />
                <span className="hidden sm:inline">Dashboard</span>
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
        <button
          onClick={() => navigate('/employee/dashboard')}
          className="flex items-center gap-2 text-sky-600 hover:text-sky-800 font-medium mb-6 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </button>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'All', count: stats.all, color: 'sky', icon: History },
            { label: 'Pending', count: stats.pending, color: 'yellow', icon: Clock },
            { label: 'Approved', count: stats.approved, color: 'green', icon: CheckCircle },
            { label: 'Processed', count: stats.processed, color: 'blue', icon: Send },
            { label: 'Rejected', count: stats.rejected, color: 'red', icon: XCircle },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={() => setStatusFilter(stat.label.toLowerCase())}
              className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-white/20 transition-all duration-200 hover:shadow-xl ${
                statusFilter === stat.label.toLowerCase() ? 'ring-2 ring-sky-500' : ''
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`p-2 bg-${stat.color}-100 rounded-xl`}>
                  <stat.icon size={20} className={`text-${stat.color}-600`} />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 mb-6 border border-white/20">
          <div className="flex items-center gap-4">
            <Filter size={20} className="text-gray-500" />
            <div className="flex items-center gap-2 flex-wrap">
              {['all', 'pending', 'approved', 'processed', 'rejected'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    statusFilter === filter
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-sky-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-100 rounded-lg">
                  <History size={20} className="text-sky-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {statusFilter === 'all' ? 'All Transactions' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Transactions`}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Showing {filteredTransactions.length} of {transactions.length} transactions
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <History size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No transactions found</h3>
              <p className="text-gray-500">
                {statusFilter === 'all' 
                  ? 'No transactions in the system yet.' 
                  : `No ${statusFilter} transactions found.`}
              </p>
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
                      Provider
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
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
                        <div className="text-sm text-gray-900">{transaction.provider || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full border ${getStatusColor(transaction.status)}`}>
                          {getStatusIcon(transaction.status)}
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(transaction.created_at).toLocaleDateString('en-ZA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.created_at).toLocaleTimeString('en-ZA', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(transaction)}
                          className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-sm hover:shadow"
                        >
                          <Eye size={16} />
                          <span className="hidden sm:inline">View</span>
                        </button>
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
                  <History size={16} />
                  Transaction Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Transaction ID</p>
                    <p className="text-sm font-medium text-gray-900">#{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Status</p>
                    <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full border ${getStatusColor(selectedTransaction.status)}`}>
                      {getStatusIcon(selectedTransaction.status)}
                      {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Amount</p>
                    <p className="text-sm font-bold text-gray-900">{selectedTransaction.amount} {selectedTransaction.currency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Provider</p>
                    <p className="text-sm font-medium text-gray-900">{selectedTransaction.provider || 'N/A'}</p>
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
                  {selectedTransaction.updated_at && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Updated At</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(selectedTransaction.updated_at).toLocaleString('en-ZA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
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
