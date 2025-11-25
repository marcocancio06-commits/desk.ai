import Link from 'next/link';
import { MARKETPLACE_ENABLED } from '../lib/featureFlags';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/">
              <div className="inline-flex items-center gap-3 cursor-pointer group mb-4 sm:mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                  <span className="text-2xl font-bold text-white">G</span>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-white">
                    Growzone
                  </div>
                  <div className="text-xs text-gray-400 font-medium">
                    Powered by Desk.ai
                  </div>
                </div>
              </div>
            </Link>
            
            <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 leading-relaxed max-w-md">
              AI-powered customer engagement for local businesses. Connect with customers 
              instantly and grow your business with intelligent automation.
            </p>
            
            {/* Early Access Badge */}
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 backdrop-blur-sm">
              <svg className="w-4 h-4 mr-2 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
              <span className="text-xs sm:text-sm font-semibold text-purple-300">
                Early Access
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Product</h3>
            <ul className="space-y-2 sm:space-y-3">
              {MARKETPLACE_ENABLED && (
                <li>
                  <Link href="/marketplace" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors flex items-center group">
                    <span className="group-hover:translate-x-1 transition-transform">Marketplace</span>
                  </Link>
                </li>
              )}
              <li>
                <Link href="/#features" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform">Features</span>
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform">Pricing</span>
                </Link>
              </li>
              <li>
                <Link href="/owner-signup" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform">For Business Owners</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Company</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link href="/#about" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform">About</span>
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:support@growzone.ai" 
                  className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors flex items-center group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">Contact</span>
                </a>
              </li>
              <li>
                <Link href="/login" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform">Login</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform">Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors flex items-center group">
                  <span className="group-hover:translate-x-1 transition-transform">Terms of Service</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 mt-8 sm:mt-12 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
              © {currentYear} Growzone. All rights reserved. Powered by{' '}
              <a 
                href="https://desk.ai" 
                className="text-blue-400 hover:text-blue-300 font-semibold"
                target="_blank"
                rel="noopener noreferrer"
              >
                Desk.ai
              </a>
            </div>

            {/* Contact Email */}
            <div className="text-xs sm:text-sm text-gray-400">
              <a 
                href="mailto:support@growzone.ai" 
                className="hover:text-white transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                support@growzone.ai
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
