/**
 * withClientAuth - Higher-Order Component for Client-Only Routes
 * 
 * Protects routes that should only be accessible by users with role='client'
 * Redirects owners to /dashboard
 * Redirects unauthenticated users to /auth/login?role=client
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCurrentUser } from '../hooks/useCurrentUser';

export function withClientAuth(Component) {
  return function ClientProtectedRoute(props) {
    const router = useRouter();
    const { user, profile, loading } = useCurrentUser();

    useEffect(() => {
      if (loading) return;

      // Not logged in at all - redirect to login
      if (!user) {
        console.log('No user, redirecting to client login');
        const currentPath = router.asPath;
        router.push(`/auth/login?role=client&next=${encodeURIComponent(currentPath)}`);
        return;
      }

      // Logged in but no profile - redirect to home (error state)
      if (!profile) {
        console.warn('User has no profile, redirecting to home');
        router.push('/?error=no_profile');
        return;
      }

      // Logged in as owner - redirect to dashboard
      if (profile.role === 'owner') {
        console.log('Owner trying to access client route, redirecting to dashboard');
        router.push('/dashboard');
        return;
      }

      // All good - user is a client
    }, [user, profile, loading, router]);

    // Show loading state while checking auth
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-slate-400">Loading...</p>
          </div>
        </div>
      );
    }

    // Not authenticated or wrong role
    if (!user || !profile || profile.role !== 'client') {
      return null;
    }

    // Authenticated as client, render the component
    return <Component {...props} />;
  };
}
