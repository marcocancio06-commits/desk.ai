// Navigation component for demo pages
// Provides consistent navigation between demo chat and dashboard

import Link from 'next/link';
import { DEMO_BUSINESS } from '../../config/demoConfig';

export default function DemoNav({ currentPage }) {
  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-14">
          <div className="flex items-center">
            <span className="font-semibold text-gray-900">{DEMO_BUSINESS.name}</span>
            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded font-medium">Demo</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link 
              href="/demo/dashboard"
              className={`text-sm transition-colors ${
                currentPage === 'dashboard' 
                  ? 'text-blue-600 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              href="/demo-chat/owner"
              className={`text-sm transition-colors ${
                currentPage === 'chat' 
                  ? 'text-blue-600 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Demo Chat
            </Link>
            <Link 
              href="/demo-chat/customer"
              className={`text-sm transition-colors ${
                currentPage === 'customer' 
                  ? 'text-blue-600 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Customer View
            </Link>
            <Link 
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
