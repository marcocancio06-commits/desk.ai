/**
 * Client Home Page
 * Landing page for users with role='client'
 * Provides access to chat and marketplace features
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Logo from '../components/Logo';
import { useCurrentUser } from '../hooks/useCurrentUser';

export default function ClientHome() {
  const router = useRouter();
  const { user, profile, loading } = useCurrentUser();
  const [message, setMessage] = useState('');

  // Get message from query params
  useEffect(() => {
    if (router.query.message) {
      setMessage(router.query.message);
      // Clear message from URL after showing it
      const timer = setTimeout(() => {
        router.replace('/client', undefined, { shallow: true });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?role=client');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Logo variant="medium" showText={true} />
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {profile.full_name || user.email}
              </span>
              <button
                onClick={() => {
                  // Sign out functionality
                  router.push('/auth/login');
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Message notification */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-blue-700">{message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Desk.ai
          </h1>
          <p className="text-xl text-gray-600">
            Your customer portal for chat and marketplace
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Chat Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Business Chat
            </h2>
            <p className="text-gray-600 mb-6">
              Connect with local businesses, get instant quotes, and book services through our AI-powered chat.
            </p>
            <Link
              href="/demo-chat"
              className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors"
            >
              Start Chatting
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Marketplace Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Business Directory
            </h2>
            <p className="text-gray-600 mb-6">
              Browse local service providers, read reviews, and discover trusted businesses in your area.
            </p>
            <Link
              href="/directory"
              className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Explore Directory
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Info section */}
        <div className="mt-12 max-w-2xl mx-auto bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">
                Customer Account
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                You're signed in as a customer. If you're a business owner looking to set up your AI front desk, 
                please <Link href="/get-started" className="text-blue-600 hover:text-blue-700 font-medium">create a business owner account</Link>.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-gray-500">
            © 2025 Desk.ai. Free during beta. Questions? Contact{' '}
            <a href="mailto:support@desk.ai" className="text-blue-600 hover:text-blue-700">
              support@desk.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
