// Simplified Dashboard - MVP Version
// Just proves the session works, no business logic yet

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function Dashboard() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured || !supabase) {
        router.replace('/auth/login');
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      console.log('📦 getSession:', { data, error });

      if (error || !data.session) {
        router.replace('/auth/login');
      } else {
        setSession(data.session);
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const handleSignOut = async () => {
    if (!supabase) return;
    
    console.log('🚪 Signing out...');
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400">Loading dashboard…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-50 mb-2">
              Desk.ai Dashboard (MVP)
            </h1>
            <p className="text-slate-400">
              Auth is working! You're successfully logged in.
            </p>
          </div>

          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-slate-800/50 rounded-xl border border-white/5 p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-4">
                Session Info
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="text-slate-500 w-24">Email:</span>
                  <span className="text-slate-100 font-mono">
                    {session.user.email}
                  </span>
                </div>
                <div className="flex">
                  <span className="text-slate-500 w-24">User ID:</span>
                  <span className="text-slate-300 font-mono text-xs">
                    {session.user.id}
                  </span>
                </div>
                <div className="flex">
                  <span className="text-slate-500 w-24">Role:</span>
                  <span className="text-purple-400 font-semibold">
                    {session.user.user_metadata?.role || 'owner'}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-indigo-500/10 border border-indigo-400/30 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-indigo-200 mb-3">
                ✅ Auth Simplified Successfully
              </h2>
              <ul className="space-y-2 text-sm text-indigo-300">
                <li>• Login redirects to /dashboard</li>
                <li>• Signup redirects to /onboarding</li>
                <li>• No infinite spinners</li>
                <li>• Clear console logging</li>
                <li>• Everyone treated as business owner (MVP)</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleSignOut}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 font-medium transition-all"
              >
                Sign Out
              </button>
              <button
                onClick={() => router.push('/onboarding')}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 hover:from-indigo-600 hover:via-purple-600 hover:to-fuchsia-600 rounded-xl text-white font-semibold transition-all shadow-lg"
              >
                Go to Onboarding
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
