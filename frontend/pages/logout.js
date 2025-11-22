import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { signOut } from '../lib/supabase';

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    async function performLogout() {
      try {
        await signOut();
        // Redirect to home page after logout
        setTimeout(() => {
          router.push('/');
        }, 500);
      } catch (error) {
        console.error('Logout error:', error);
        router.push('/');
      }
    }

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-700 text-lg">Signing out...</p>
      </div>
    </div>
  );
}
