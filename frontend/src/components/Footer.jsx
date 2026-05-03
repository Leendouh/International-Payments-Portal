import React from 'react';
import { Shield, Globe } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary-900 text-secondary-300 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Company Info */}
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-600">
                <Globe size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                International Payments Portal
              </h3>
            </div>
            <p className="text-sm text-secondary-400 max-w-2xl">
              Secure international payment processing with bank-level encryption and SWIFT network integration.
            </p>
            <div className="flex items-center gap-2 text-xs text-secondary-500">
              <Shield size={14} />
              <span>Bank-Level Security</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-secondary-800 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-secondary-500">
              © {currentYear} International Payments Portal. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-xs text-secondary-500">
              <a href="#" className="hover:text-primary-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                Security
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
