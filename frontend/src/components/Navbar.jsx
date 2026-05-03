import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Shield, 
  Menu, 
  X, 
  Globe, 
  CreditCard, 
  FileText, 
  LogOut, 
  User,
  ChevronDown
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setIsProfileDropdownOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const NavLinks = ({ mobile = false }) => (
    <>
      <Link 
        to="/dashboard" 
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
          mobile 
            ? 'text-secondary-700 hover:bg-secondary-100 hover:text-primary-600' 
            : 'text-secondary-700 hover:text-primary-600 hover:bg-secondary-50'
        }`}
        onClick={() => mobile && setIsMobileMenuOpen(false)}
      >
        <Globe size={18} strokeWidth={2} />
        Dashboard
      </Link>
      <Link 
        to="/payment" 
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
          mobile 
            ? 'text-secondary-700 hover:bg-secondary-100 hover:text-primary-600' 
            : 'text-secondary-700 hover:text-primary-600 hover:bg-secondary-50'
        }`}
        onClick={() => mobile && setIsMobileMenuOpen(false)}
      >
        <CreditCard size={18} strokeWidth={2} />
        Send Payment
      </Link>
      <Link 
        to="/history" 
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
          mobile 
            ? 'text-secondary-700 hover:bg-secondary-100 hover:text-primary-600' 
            : 'text-secondary-700 hover:text-primary-600 hover:bg-secondary-50'
        }`}
        onClick={() => mobile && setIsMobileMenuOpen(false)}
      >
        <FileText size={18} strokeWidth={2} />
        History
      </Link>
    </>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-white/30 shadow-lg">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg group-hover:shadow-strong transition-all duration-300">
                <Shield className="text-white" size={24} strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-secondary-900 group-hover:text-primary-700 transition-colors">
                  International Payments Portal
                </h1>
                <p className="text-xs text-secondary-600">Secure Global Transfers</p>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {user && <NavLinks />}
          </div>

          {/* User Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={toggleProfileDropdown}
                  className="flex items-center gap-3 px-4 py-2 rounded-xl bg-secondary-100 hover:bg-secondary-200 transition-all duration-300 group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                    <User size={16} className="text-white" strokeWidth={2} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-secondary-900">Welcome</p>
                    <p className="text-xs text-secondary-600">{user.fullName}</p>
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`text-secondary-500 transition-transform duration-300 ${
                      isProfileDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-secondary-200 shadow-xl p-2">
                    <div className="px-4 py-3 border-b border-secondary-200">
                      <p className="font-medium text-secondary-900">{user.fullName}</p>
                      <p className="text-sm text-secondary-600">{user.email}</p>
                    </div>
                    <div className="py-2">
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-3 px-4 py-2 text-secondary-700 hover:bg-secondary-50 rounded-lg transition-colors"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <Globe size={16} strokeWidth={2} />
                        Dashboard
                      </Link>
                      <Link
                        to="/history"
                        className="flex items-center gap-3 px-4 py-2 text-secondary-700 hover:bg-secondary-50 rounded-lg transition-colors"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <FileText size={16} strokeWidth={2} />
                        Transaction History
                      </Link>
                    </div>
                    <div className="border-t border-secondary-200 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                      >
                        <LogOut size={16} strokeWidth={2} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  to="/login" 
                  className="px-6 py-2 text-secondary-700 hover:text-primary-600 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn-primary px-6 py-2"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-xl bg-secondary-100 hover:bg-secondary-200 transition-all duration-300"
            >
              {isMobileMenuOpen ? (
                <X size={24} className="text-secondary-700" strokeWidth={2} />
              ) : (
                <Menu size={24} className="text-secondary-700" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-secondary-200 bg-white/90">
            <div className="py-6 space-y-4">
              {user ? (
                <>
                  <div className="px-4 py-3 bg-white/5 rounded-xl">
                    <p className="font-medium text-secondary-900">Welcome, {user.fullName}</p>
                    <p className="text-sm text-secondary-600">{user.email}</p>
                  </div>
                  <div className="space-y-2">
                    <NavLinks mobile={true} />
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 text-error-600 hover:bg-error-50 rounded-xl transition-colors"
                    >
                      <LogOut size={18} strokeWidth={2} />
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <Link 
                    to="/login" 
                    className="block px-4 py-3 text-secondary-700 hover:bg-secondary-100 rounded-xl transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="block btn btn-primary mx-4"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
