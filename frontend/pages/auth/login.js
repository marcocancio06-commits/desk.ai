// Owner Login Page - /auth/login
// Secure login for existing business owners

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Logo from '../../components/Logo';
import MarketingLayout from '../../components/marketing/MarketingLayout';
import { signIn, getUserProfile, getUserBusinessStatus } from '../../lib/supabase';
import { MARKETPLACE_ENABLED } from '../../lib/featureFlags';

export default function Login() {
  const router = useRouter();
  const { role: roleParam } = router.query;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingBusiness, setCheckingBusiness] = useState(false);
  const [error, setError] = useState(null);
  const [expectedRole, setExpectedRole] = useState(null);

  // Set expected role from query params
  useEffect(() => {
    if (roleParam) {
      const normalizedRole = roleParam.toLowerCase();
      if (normalizedRole === 'owner' || normalizedRole === 'client') {
        setExpectedRole(normalizedRole);
      }
    }
  }, [roleParam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      // Validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Sign in with Supabase
      console.log('Signing in...', email);
      const { user } = await signIn(email, password);
      
      if (!user) throw new Error('Invalid login response');
      
      console.log('✅ Login successful');
      
      // Fetch user profile to get role
      const profile = await getUserProfile(user.id);
      
      if (!profile) {
        console.warn('No profile found for user, redirecting to home');
        router.push('/');
        return;
      }
      
      console.log('User role:', profile.role);
      
      // Redirect based on role
      if (profile.role === 'owner') {
        console.log('Owner logged in, checking business status...');
        setCheckingBusiness(true);
        
        // Check if owner has any businesses
        const businessStatus = await getUserBusinessStatus(user.id);
        console.log('Business status:', businessStatus);
        
        if (businessStatus.hasBusiness) {
          console.log('Owner has business, redirecting to dashboard...');
          router.push('/dashboard');
        } else {
          console.log('Owner has no business yet, redirecting to onboarding...');
          router.push('/onboarding');
        }
      } else {
        // Clients/customers go to marketplace (if enabled) or client page
        if (MARKETPLACE_ENABLED) {
          console.log('Customer logged in, redirecting to marketplace...');
          router.push('/marketplace');
        } else {
          console.log('Customer logged in, redirecting to client page...');
          router.push('/client');
        }
      }
      
    } catch (err) {
      console.error('Login error:', err);
      
      // User-friendly error messages
      let errorMessage = 'Failed to sign in. Please try again.';
      if (err.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (err.message.includes('Email not confirmed')) {
        errorMessage = 'Please confirm your email address';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <MarketingLayout>
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-6">
            <Logo variant="large" showText={true} />
          </div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-50">
            Sign in to Desk.ai
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            {expectedRole === 'owner' ? 'Business Owner Login' : expectedRole === 'client' ? 'Customer Login' : 'Sign in to your account'} • Don't have an account?{' '}
            <Link href={`/auth/signup${roleParam ? `?role=${roleParam}` : ''}`} className="font-medium text-purple-400 hover:text-purple-300 transition-colors">
              Sign up
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-900/60 backdrop-blur-xl py-8 px-4 shadow-[0_20px_60px_rgba(0,0,0,0.7)] rounded-2xl sm:px-10 border border-white/10">
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-400/30 rounded-xl p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-200">
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
                    disabled={loading}
                    className="appearance-none block w-full px-4 py-3 border border-slate-700 bg-slate-900/70 rounded-xl text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-200">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="appearance-none block w-full px-4 py-3 border border-slate-700 bg-slate-900/70 rounded-xl text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-purple-500 focus:ring-purple-500 border-slate-700 rounded bg-slate-900/70"
                    defaultChecked
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-300">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/auth/forgot-password" className="font-medium text-purple-400 hover:text-purple-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || checkingBusiness}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 hover:shadow-purple-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading || checkingBusiness ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {checkingBusiness ? 'Loading your account...' : 'Signing in...'}
                    </span>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
