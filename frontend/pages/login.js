import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { signIn, signUp, getSession } from '../lib/supabase';

export default function Login() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if already logged in
    checkSession();
  }, []);

  async function checkSession() {
    const session = await getSession();
    if (session) {
      router.push('/dashboard');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        const { user, session } = await signUp(email, password, {
          full_name: fullName || email.split('@')[0]
        });

        if (session) {
          // Successful signup with immediate login
          setMessage('Account created! Redirecting...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        } else {
          // Email confirmation required
          setMessage('Check your email to confirm your account!');
        }
      } else {
        // Sign in
        const { session } = await signIn(email, password);
        
        if (session) {
          setMessage('Login successful! Redirecting...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 500);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setIsSignUp(!isSignUp);
    setError('');
    setMessage('');
  }

  return (
    <>
      <Head>
        <title>{isSignUp ? 'Sign Up' : 'Login'} - Desk.ai</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <Link href="/">
              <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer">
                Desk.ai
              </span>
            </Link>
            <p className="text-gray-600 mt-2">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </p>
          </div>

          {/* Auth Card */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {message && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">{message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {isSignUp && (
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 6 characters
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </span>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={toggleMode}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {isSignUp ? (
                  <>Already have an account? Sign in</>
                ) : (
                  <>Don't have an account? Sign up</>
                )}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link href="/">
                <span className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                  ← Back to home
                </span>
              </Link>
            </div>
          </div>

          {/* Demo Note */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              New users are automatically connected to the demo business
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
