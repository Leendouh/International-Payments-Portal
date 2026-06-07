import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { Shield, User, Mail, Calendar, LogOut, RefreshCw, Users, Plus, X, ArrowLeft, Key } from 'lucide-react';

export default function EmployeeProfile() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    role: 'employee'
  });
  const [creating, setCreating] = useState(false);
  const [stats, setStats] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedEmployeeForReset, setSelectedEmployeeForReset] = useState(null);
  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (employee?.role === 'admin') {
      fetchStats();
      fetchAllEmployees();
    }
  }, [employee]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/employee/profile');
      setEmployee(response.data.employee);
    } catch (error) {
      toast.error('Failed to fetch profile');
      console.error('Error:', error);
      if (error.response?.status === 401) {
        navigate('/employee/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/employee/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const response = await api.get('/employee/all');
      setAllEmployees(response.data.employees);
    } catch (error) {
      console.error('Failed to fetch all employees:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employee');
    delete api.defaults.headers.common['Authorization'];
    navigate('/employee/login');
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      await api.post('/employee/create', formData);
      toast.success('Employee created successfully');
      setShowAddEmployeeModal(false);
      setFormData({
        username: '',
        fullName: '',
        email: '',
        password: '',
        role: 'employee'
      });
      fetchAllEmployees();
      fetchStats();
    } catch (error) {
      // Display generic error message for security
      toast.error('Failed to create employee. Please check your information and try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (resetPasswordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setResettingPassword(true);

    try {
      await api.post(`/employee/reset-password/${selectedEmployeeForReset.id}`, {
        newPassword: resetPasswordForm.newPassword
      });
      toast.success('Password reset successfully');
      setShowResetPasswordModal(false);
      setResetPasswordForm({
        newPassword: '',
        confirmPassword: ''
      });
      setSelectedEmployeeForReset(null);
    } catch (error) {
      // Display generic error message for security
      toast.error('Failed to reset password. Please try again.');
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
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
                <h1 className="text-2xl font-bold">Employee Profile</h1>
                <p className="text-sky-100 text-sm">Manage your account</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/employee/dashboard')}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-all duration-200"
              >
                <RefreshCw size={18} />
                <span className="hidden sm:inline">Dashboard</span>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-sky-500 to-sky-600 rounded-full shadow-lg mb-4">
                  <User size={48} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{employee?.full_name}</h2>
                <p className="text-gray-600">{employee?.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-medium capitalize">
                  {employee?.role}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User size={20} className="text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Username</p>
                    <p className="text-sm font-medium text-gray-900">{employee?.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail size={20} className="text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{employee?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar size={20} className="text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Member Since</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(employee?.created_at).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {employee?.role === 'admin' && (
                <button
                  onClick={() => setShowAddEmployeeModal(true)}
                  className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-lg hover:from-sky-600 hover:to-sky-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus size={20} />
                  <span>Add New Employee</span>
                </button>
              )}
            </div>
          </div>

          {/* Account Details */}
          <div className="lg:col-span-2">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Shield size={24} className="text-sky-600" />
                Account Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-sky-50 rounded-xl border border-sky-200">
                  <h4 className="text-sm font-semibold text-sky-900 mb-2">Employee ID</h4>
                  <p className="text-2xl font-bold text-gray-900">#{employee?.id}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <h4 className="text-sm font-semibold text-purple-900 mb-2">Role</h4>
                  <p className="text-2xl font-bold text-gray-900 capitalize">{employee?.role}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <h4 className="text-sm font-semibold text-green-900 mb-2">Status</h4>
                  <p className="text-2xl font-bold text-gray-900">Active</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <h4 className="text-sm font-semibold text-orange-900 mb-2">Last Login</h4>
                  <p className="text-sm font-medium text-gray-900">
                    {employee?.last_login ? new Date(employee.last_login).toLocaleString('en-ZA') : 'Never'}
                  </p>
                </div>
              </div>

              {employee?.role === 'admin' && stats && (
                <div className="mt-6 p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-200">
                  <h4 className="text-sm font-semibold text-sky-900 mb-4 flex items-center gap-2">
                    <Users size={16} />
                    Team Overview
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                      <p className="text-3xl font-bold text-sky-600">{stats.admin}</p>
                      <p className="text-xs text-gray-600 mt-1">Admins</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                      <p className="text-3xl font-bold text-purple-600">{stats.manager}</p>
                      <p className="text-xs text-gray-600 mt-1">Managers</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                      <p className="text-3xl font-bold text-green-600">{stats.employee}</p>
                      <p className="text-xs text-gray-600 mt-1">Employees</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-sky-200">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Total Team:</span> {stats.total} members
                    </p>
                  </div>
                </div>
              )}

              {employee?.role === 'admin' && allEmployees.length > 0 && (
                <div className="mt-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users size={24} className="text-sky-600" />
                    Team Members
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Username
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {allEmployees.map((emp) => (
                          <tr key={emp.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-semibold text-sky-700">
                                    {emp.full_name.charAt(0)}
                                  </span>
                                </div>
                                <div className="text-sm font-medium text-gray-900">{emp.full_name}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {emp.username}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {emp.email}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                emp.role === 'admin' ? 'bg-sky-100 text-sky-800' :
                                emp.role === 'manager' ? 'bg-purple-100 text-purple-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {emp.role.charAt(0).toUpperCase() + emp.role.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => {
                                  setSelectedEmployeeForReset(emp);
                                  setShowResetPasswordModal(true);
                                }}
                                className="flex items-center gap-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 text-xs"
                              >
                                <Key size={14} />
                                Reset Password
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {employee?.role === 'admin' && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <h4 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                    <Shield size={16} />
                    Admin Privileges
                  </h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Approve and reject transactions</li>
                    <li>• Process transactions to SWIFT</li>
                    <li>• Create new employee accounts</li>
                    <li>• Full access to all features</li>
                  </ul>
                </div>
              )}

              {employee?.role === 'manager' && (
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Shield size={16} />
                    Manager Privileges
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Approve pending transactions</li>
                    <li>• View all transaction details</li>
                    <li>• Cannot reject or process transactions</li>
                  </ul>
                </div>
              )}

              {employee?.role === 'employee' && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Shield size={16} />
                    Employee Privileges
                  </h4>
                  <ul className="text-sm text-gray-800 space-y-1">
                    <li>• View pending and approved transactions</li>
                    <li>• View transaction details</li>
                    <li>• Cannot approve, reject, or process transactions</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users size={20} />
                Add New Employee
              </h2>
              <button
                onClick={() => setShowAddEmployeeModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Enter email"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Enter password"
                  required
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
                  Role
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-gradient-to-r from-sky-500 to-sky-600 text-white py-3 rounded-lg hover:from-sky-600 hover:to-sky-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
              >
                {creating ? 'Creating...' : 'Create Employee'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedEmployeeForReset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Key size={20} />
                Reset Password
              </h2>
              <button
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setSelectedEmployeeForReset(null);
                  setResetPasswordForm({
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-900">
                  <span className="font-semibold">Employee:</span> {selectedEmployeeForReset.full_name}
                </p>
                <p className="text-sm text-orange-700">
                  <span className="font-semibold">Username:</span> {selectedEmployeeForReset.username}
                </p>
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={resetPasswordForm.newPassword}
                  onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={resetPasswordForm.confirmPassword}
                  onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                />
              </div>
              <button
                type="submit"
                disabled={resettingPassword}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
              >
                {resettingPassword ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
