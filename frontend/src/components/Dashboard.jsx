import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Footer from './Footer';
import {
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Zap,
  Lock,
  Eye,
  FileText,
  Wallet
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPayments: 0,
    pendingPayments: 0,
    completedPayments: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real data from API
    const loadDashboardData = async () => {
      try {
        const { api } = await import('../services/api');
        
        // Fetch payment history
        const paymentsResponse = await api.get('/payments');
        console.log('Payments API response:', paymentsResponse.data);
        const payments = paymentsResponse.data.transactions || [];
        console.log('Payments array:', payments);
        
        // Calculate statistics from real data
        const totalPayments = payments.length;
        const pendingPayments = payments.filter(p => p.status === 'pending').length;
        const completedPayments = payments.filter(p => p.status === 'completed').length;
        
        console.log('Calculated stats:', {
          totalPayments,
          pendingPayments,
          completedPayments,
          paymentStatuses: payments.map(p => ({ id: p.id, status: p.status }))
        });
        
        // Calculate total amount from completed payments (convert to USD equivalent)
        const totalAmount = payments
          .filter(p => p.status === 'completed')
          .reduce((sum, payment) => {
            // For now, use the amount directly (in a real app, you'd convert currencies)
            return sum + parseFloat(payment.amount);
          }, 0);
        
        // Format transactions for display
        const formattedTransactions = payments.slice(0, 4).map(payment => ({
          id: payment.id,
          recipient: payment.recipient_account || 'Unknown Recipient',
          amount: parseFloat(payment.amount),
          currency: payment.currency,
          status: payment.status,
          date: new Date(payment.created_at).toLocaleDateString(),
          type: payment.provider || 'SWIFT'
        }));
        
        setStats({
          totalPayments,
          pendingPayments,
          completedPayments,
          totalAmount
        });

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Fallback to default values if API fails
        setStats({
          totalPayments: 0,
          pendingPayments: 0,
          completedPayments: 0,
          totalAmount: 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const StatCard = ({ title, value, change, changeType, icon: Icon, color, subtitle }) => {
    const getCardClasses = () => {
      switch(color) {
        case 'primary':
          return 'bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200';
        case 'warning':
          return 'bg-gradient-to-br from-warning-50 to-warning-100 border-warning-200';
        case 'success':
          return 'bg-gradient-to-br from-success-50 to-success-100 border-success-200';
        case 'accent':
          return 'bg-gradient-to-br from-accent-50 to-accent-100 border-accent-200';
        case 'error':
          return 'bg-gradient-to-br from-error-50 to-error-100 border-error-200';
        default:
          return 'bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200';
      }
    };

    const getIconClasses = () => {
      switch(color) {
        case 'primary':
          return 'bg-gradient-to-br from-primary-400 to-primary-600 text-white';
        case 'warning':
          return 'bg-gradient-to-br from-warning-400 to-warning-600 text-white';
        case 'success':
          return 'bg-gradient-to-br from-success-400 to-success-600 text-white';
        case 'accent':
          return 'bg-gradient-to-br from-accent-400 to-accent-600 text-white';
        case 'error':
          return 'bg-gradient-to-br from-error-400 to-error-600 text-white';
        default:
          return 'bg-gradient-to-br from-primary-400 to-primary-600 text-white';
      }
    };

    return (
      <div className={`card p-6 hover:shadow-strong transition-all duration-300 group cursor-pointer ${getCardClasses()}`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${getIconClasses()} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon size={24} strokeWidth={2} />
          </div>
          {change && (
            <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${
              changeType === 'positive' ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'
            }`}>
              {changeType === 'positive' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {change}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-secondary-900 mb-1">{value}</h3>
          <p className="text-sm text-secondary-700 font-medium">{title}</p>
          {subtitle && <p className="text-xs text-secondary-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    );
  };

  const QuickAction = ({ title, description, icon: Icon, to, color }) => {
    const getCardClasses = () => {
      switch(color) {
        case 'primary':
          return 'bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200';
        case 'warning':
          return 'bg-gradient-to-br from-warning-50 to-warning-100 border-warning-200';
        case 'success':
          return 'bg-gradient-to-br from-success-50 to-success-100 border-success-200';
        case 'accent':
          return 'bg-gradient-to-br from-accent-50 to-accent-100 border-accent-200';
        case 'error':
          return 'bg-gradient-to-br from-error-50 to-error-100 border-error-200';
        default:
          return 'bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200';
      }
    };

    const getIconClasses = () => {
      switch(color) {
        case 'primary':
          return 'bg-gradient-to-br from-primary-400 to-primary-600 text-white';
        case 'warning':
          return 'bg-gradient-to-br from-warning-400 to-warning-600 text-white';
        case 'success':
          return 'bg-gradient-to-br from-success-400 to-success-600 text-white';
        case 'accent':
          return 'bg-gradient-to-br from-accent-400 to-accent-600 text-white';
        case 'error':
          return 'bg-gradient-to-br from-error-400 to-error-600 text-white';
        default:
          return 'bg-gradient-to-br from-primary-400 to-primary-600 text-white';
      }
    };

    return (
      <Link to={to} className={`card p-6 hover:shadow-strong transition-all duration-300 group ${getCardClasses()}`}>
        <div className={`inline-flex p-3 rounded-xl ${getIconClasses()} shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} strokeWidth={2} />
        </div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-2 group-hover:text-primary-700 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-secondary-600 mb-4">{description}</p>
        <div className="flex items-center gap-2 text-primary-600 font-medium text-sm group-hover:gap-3 transition-all">
          Get Started <ArrowRight size={16} />
        </div>
      </Link>
    );
  };

  const TransactionRow = ({ transaction }) => (
    <div className="flex items-center justify-between p-4 hover:bg-white/10 rounded-xl transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${
          transaction.status === 'completed' ? 'bg-success-100' : 'bg-warning-100'
        }`}>
          {transaction.status === 'completed' ? (
            <CheckCircle size={16} className="text-success-600" />
          ) : (
            <Clock size={16} className="text-warning-600" />
          )}
        </div>
        <div>
          <p className="font-medium text-secondary-900">{transaction.recipient}</p>
          <p className="text-sm text-secondary-500">{transaction.date} • {transaction.type}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-secondary-900">
          {transaction.currency} {transaction.amount.toLocaleString()}
        </p>
        <p className={`text-sm capitalize ${
          transaction.status === 'completed' ? 'text-success-600' : 'text-warning-600'
        }`}>
          {transaction.status}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Welcome back, {user?.fullName || 'User'}!
            </h1>
            <p className="text-secondary-600">
              Manage your international payments and track your transactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-success-50/80 border border-success-200/50 rounded-full flex items-center gap-2">
              <Shield size={16} className="text-success-600" />
              <span className="text-sm font-medium text-success-700">Account Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="My Payments"
          value={stats.totalPayments}
          change="+12%"
          changeType="positive"
          icon={FileText}
          color="primary"
          subtitle="Last 30 days"
        />
        <StatCard
          title="Pending"
          value={stats.pendingPayments}
          subtitle="Processing"
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="Completed"
          value={stats.completedPayments}
          change="+14"
          changeType="positive"
          icon={CheckCircle}
          color="success"
          subtitle="Successful"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-secondary-900 mb-6 flex items-center gap-2">
          <Zap size={20} className="text-primary-600" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickAction
            title="Send Payment"
            description="Send money internationally with secure SWIFT transfer"
            icon={Globe}
            to="/payment"
            color="accent"
          />
          <QuickAction
            title="View History"
            description="Track all your past and current international payments"
            icon={FileText}
            to="/history"
            color="error"
          />
        </div>
      </div>

      {/* Customer Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Security & Trust */}
        <div className="card p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
          <h2 className="text-xl font-semibold text-secondary-900 mb-6 flex items-center gap-2">
            <Shield size={20} className="text-success-600" />
            Your Security
          </h2>
          <div className="space-y-4">
            {[
              { icon: Lock, title: 'Bank-Level Security', desc: 'Your payments are protected with industry-standard encryption' },
              { icon: Eye, title: 'Secure Login', desc: 'Multi-factor authentication keeps your account safe' },
              { icon: CheckCircle, title: 'Verified Account', desc: 'Your identity has been verified for international transfers' },
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-success-50 transition-colors">
                <div className="p-2 rounded-lg bg-gradient-to-br from-success-400 to-success-600 text-white shadow-md">
                  <feature.icon size={16} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-medium text-secondary-900">{feature.title}</h3>
                  <p className="text-sm text-secondary-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account Information */}
        <div className="card p-6 bg-gradient-to-br from-secondary-50 to-slate-100 border-secondary-200">
          <h2 className="text-xl font-semibold text-secondary-900 mb-6 flex items-center gap-2">
            <Wallet size={20} className="text-secondary-600" />
            Account Details
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 px-3 rounded-lg hover:bg-secondary-50 transition-colors border-b border-secondary-200">
              <span className="text-secondary-700 font-medium">Account Status</span>
              <span className="font-medium text-secondary-900 px-3 py-1 bg-success-100 text-success-700 rounded-full text-sm">Active</span>
            </div>
            <div className="flex justify-between items-center py-3 px-3 rounded-lg hover:bg-secondary-50 transition-colors border-b border-secondary-200">
              <span className="text-secondary-700 font-medium">Daily Limit</span>
              <span className="font-medium text-secondary-900">$50,000</span>
            </div>
            <div className="flex justify-between items-center py-3 px-3 rounded-lg hover:bg-secondary-50 transition-colors border-b border-secondary-200">
              <span className="text-secondary-700 font-medium">Monthly Limit</span>
              <span className="font-medium text-secondary-900">$500,000</span>
            </div>
            <div className="flex justify-between items-center py-3 px-3 rounded-lg hover:bg-secondary-50 transition-colors">
              <span className="text-secondary-700 font-medium">Member Since</span>
              <span className="font-medium text-secondary-900">Jan 2024</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Notice */}
      <div className="card p-6 bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-md">
            <AlertCircle size={20} className="flex-shrink-0" />
          </div>
          <div>
            <h3 className="font-semibold text-warning-900 mb-2">Payment Processing Notice</h3>
            <p className="text-warning-800 text-sm leading-relaxed">
              This is a demonstration portal for educational purposes. All payments are marked as "pending" 
              and would require verification in a real banking environment. Never use real financial information 
              in demonstration systems.
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <Footer />
  </>
  );
};

export default Dashboard;
