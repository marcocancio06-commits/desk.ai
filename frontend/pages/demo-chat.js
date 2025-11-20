// Main demo-chat route - redirects to owner view
// This keeps backward compatibility while separating customer/owner experiences

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function DemoChat() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to owner view by default
    router.replace('/demo-chat/owner');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Redirecting to demo chat...</p>
      </div>
    </div>
  );
}
