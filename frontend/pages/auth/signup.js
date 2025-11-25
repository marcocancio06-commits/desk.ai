// Owner Signup Page - /auth/signup
// Simplified flow: Create account → Redirect to onboarding wizard
// Handles email confirmation when enabled in Supabase

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Logo from '../../components/Logo';
import { supabase, signUp, upsertProfile } from '../../lib/supabase';
import { MARKETPLACE_ENABLED } from '../../lib/featureFlags';

export default function Signup() {
  const router = useRouter();
  const { role: roleParam } = router.query;
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userRole, setUserRole] = useState('client'); // Default to client
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  // Set role from query params
  useEffect(() => {
    if (roleParam) {
      const normalizedRole = roleParam.toLowerCase();
      if (normalizedRole === 'owner' || normalizedRole === 'client') {
        setUserRole(normalizedRole);
      } else {
        console.warn('Invalid role parameter, defaulting to client');
        setUserRole('client');
      }
    }
  }, [roleParam]);

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      // Validation
      if (!email || !password) {
        setError('Email and password are required');
        setLoading(false);
        return;
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      
      // Create Supabase Auth user
      console.log('Creating auth user with role:', userRole);
      const authData = await signUp(email, password, {
        role: userRole // Pass role as metadata
      });
      
      console.log('SignUp response:', { 
        hasUser: !!authData?.user, 
        hasSession: !!authData?.session,
        emailConfirmationRequired: authData?.emailConfirmationRequired 
      });
      
      // Check if email confirmation is required
      if (authData && authData.emailConfirmationRequired) {
        console.log('Email confirmation required');
        setEmailConfirmationRequired(true);
        setLoading(false);
        return;
      }
      
      // User created successfully, check if we have a user object
      if (!authData || !authData.user) {
        console.error('Invalid signup response:', authData);
        throw new Error('Failed to create user - invalid response from server');
      }
      
      const userId = authData.user.id;
      console.log('Auth user created:', userId);
      
      // Create profile with role
      console.log('Creating profile with role:', userRole);
      await upsertProfile(userId, {
        full_name: email.split('@')[0], // Default name from email
        role: userRole
      });
      
      console.log('✅ Profile created with role:', userRole);
      
      // Success! Redirect based on role
      // Note: We intentionally keep loading=true during redirect for UX
      if (userRole === 'owner') {
        console.log('Redirecting owner to onboarding...');
        await router.push('/onboarding');
      } else {
        // Customers go to marketplace (if enabled) or client page
        if (MARKETPLACE_ENABLED) {
          console.log('Redirecting customer to marketplace...');
          await router.push('/marketplace');
        } else {
          console.log('Redirecting customer to client page...');
          await router.push('/client');
        }
      }
      
      // If redirect somehow doesn't complete, ensure loading is reset
      setLoading(false);
      
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  // Email confirmation success screen
  if (emailConfirmationRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-6">
            <Logo variant="large" showText={true} />
          </div>
          <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10 border border-gray-200">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-100 p-3">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                </svg>
              </div>
            </div>

            <h2 className="text-center text-2xl font-bold text-gray-900 mb-4">
              Check Your Email
            </h2>
            
            <p className="text-center text-gray-600 mb-6">
              We've sent a confirmation link to:
            </p>
            
            <p className="text-center text-lg font-semibold text-gray-900 mb-6">
              {email}
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <svg className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Please confirm your email address</p>
                  <p>Click the link in the email to activate your account and continue to the onboarding wizard.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-500 text-center">
                Didn't receive the email? Check your spam folder or{' '}
                <button 
                  onClick={() => {
                    setEmailConfirmationRequired(false);
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  try again
                </button>
              </p>
              
              <div className="pt-4 border-t border-gray-200">
                <Link 
                  href="/auth/login"
                  className="block w-full text-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Logo variant="large" showText={true} />
        </div>
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Create Your {userRole === 'owner' ? 'Business Owner' : 'Customer'} Account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {userRole === 'owner' ? 'Set up your AI front desk in minutes' : 'Access chat and marketplace'} • Already have an account?{' '}
          <Link href={`/auth/login${roleParam ? `?role=${roleParam}` : ''}`} className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10 border border-gray-200">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleAccountSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  <>
                    Create Account
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info notice */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            {userRole === 'owner' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Business Owner Account</span>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  After creating your account, you'll complete a quick setup wizard to configure your business.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  <span>Customer Account</span>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Access business chat and marketplace features.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
