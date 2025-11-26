/**
 * withOwnerAuth - Higher-Order Component for Owner-Only Routes
 * 
 * Protects routes that should only be accessible by users with role='owner'
 * Redirects clients to /client page with a message
 * Redirects unauthenticated users to /auth/login
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCurrentUser } from '../hooks/useCurrentUser';

export function withOwnerAuth(Component) {
  return function OwnerProtectedRoute(props) {
    const router = useRouter();
    const { user, profile, loading } = useCurrentUser();

    useEffect(() => {
      if (loading) return;

      // Not logged in at all - redirect to login
      if (!user) {
        console.log('No user, redirecting to login');
        router.push('/auth/login?role=owner');
        return;
      }

      // Logged in but no profile - redirect to home (error state)
      if (!profile) {
        console.warn('User has no profile, redirecting to home');
        router.push('/?error=no_profile');
        return;
      }

      // Logged in as client - redirect to marketplace
      if (profile.role === 'client') {
        console.log('Client trying to access owner route, redirecting to marketplace');
        router.push('/marketplace');
        return;
      }

      // All good - user is an owner
    }, [user, profile, loading, router]);

    // Show loading state while checking auth
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    // Not authenticated or wrong role
    if (!user || !profile || profile.role !== 'owner') {
      return null;
    }

    // Authenticated as owner, render the component
    return <Component {...props} />;
  };
}
