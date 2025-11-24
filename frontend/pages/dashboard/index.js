import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import MetricCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import QuickActionCard from '../../components/ui/QuickActionCard';
import RecentActivityTimeline from '../../components/dashboard/RecentActivityTimeline';
import { BACKEND_URL } from '../../lib/config';
import { withAuth, useAuth } from '../../contexts/AuthContext';
import { withOwnerAuth } from '../../lib/withOwnerAuth';
import { getAuthHeader } from '../../lib/supabase';

function Dashboard() {
  const { currentBusiness, businessLoading, getCurrentBusinessId } = useAuth();
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false); // Only for data fetching, not business loading
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchData = async () => {
    const businessId = getCurrentBusinessId();
    if (!businessId) {
      console.warn('No business selected');
      return;
    }
    
    const isRefresh = loading || refreshing; // Are we refreshing (vs initial load)?
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`${BACKEND_URL}/api/leads?businessId=${businessId}`, {
        headers: authHeader
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch leads: ${res.status}`);
      }
      
      const data = await res.json();
      setLeads(data.leads || []);
      setStats(data.stats);
      setError(null);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err.message);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };
  
  useEffect(() => {
    // Only fetch data when we have a business and business loading is complete
    if (currentBusiness && !businessLoading) {
      fetchData();
    }
  }, [currentBusiness, businessLoading]);
  
  const handleRefresh = () => {
    fetchData();
  };
  
  // Calculate stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayLeads = leads.filter(lead => {
    const leadDate = new Date(lead.createdAt);
    leadDate.setHours(0, 0, 0, 0);
    return leadDate.getTime() === today.getTime();
  });
  
  const collectingInfo = stats?.collecting_info || 0;
  const qualified = stats?.qualified || 0;
  const scheduled = stats?.scheduled || 0;
  const closedWon = stats?.closed_won || 0;
  
  // Recent activity (last 5 leads)
  const recentLeads = leads.slice(0, 5);
  
  // Show loading only while fetching data (not while waiting for business to load)
  if (loading && !currentBusiness) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50 -m-8 p-8 mb-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
            <p className="text-slate-600">Overview of your business activity</p>
          </div>
        </div>
        <EmptyState
          icon={
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          title="Failed to load dashboard"
          subtitle={`${error}. Make sure the backend server is running on ${BACKEND_URL}`}
        />
      </Layout>
    );
  }

  // No business associated with user - show onboarding CTA (only after business loading completes)
  if (!currentBusiness && !businessLoading) {
    return (
      <Layout>
        <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50 -m-8 p-8 mb-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to Desk.ai</h1>
            <p className="text-slate-600">Let's get your business set up</p>
          </div>
        </div>
        <EmptyState
          icon={
            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          title="No business connected"
          subtitle="You haven't set up a business yet. Complete onboarding to start managing leads and appointments."
          action={
            <a
              href="/onboarding"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Get Started
            </a>
          }
        />
      </Layout>
    );
  }
  
  return (
    <Layout>
      {/* Enhanced Gradient Header */}
      <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-transparent -m-8 p-8 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                Dashboard
              </h1>
              <p className="text-slate-600">Overview of your business activity</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="group flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 bg-white/90 backdrop-blur-sm border border-slate-300/50 rounded-full hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                <svg 
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <div className="hidden md:flex items-center text-sm text-slate-500 space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200/50">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Grid - Responsive: 1 col mobile → 2 col tablet → 3 col desktop → 4 col wide */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
        <div className="animate-fadeIn animate-delay-100">
          <MetricCard
            title="New Leads Today"
            value={todayLeads.length}
            subtitle={`${leads.length} total leads`}
            icon={
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
            color="blue"
          />
        </div>
        <div className="animate-fadeIn animate-delay-200">
          <MetricCard
            title="Collecting Info"
            value={collectingInfo}
            subtitle="Gathering details"
            icon={
              <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
            color="yellow"
          />
        </div>
        <div className="animate-fadeIn animate-delay-300">
          <MetricCard
            title="Qualified"
            value={qualified}
            subtitle="Ready to schedule"
            icon={
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="green"
          />
        </div>
        <div className="animate-fadeIn animate-delay-400">
          <MetricCard
            title="Scheduled"
            value={scheduled}
            subtitle="Booked appointments"
            icon={
              <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            color="purple"
          />
        </div>
      </div>
      
      {/* Section Divider */}
      <div className="border-t border-slate-200 mb-8"></div>
      
      {/* Recent Activity */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-1">Recent Activity</h2>
            <p className="text-sm text-slate-500">Latest events and updates</p>
          </div>
          <a href="/dashboard/leads" className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors flex items-center">
            View all leads
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        {recentLeads.length > 0 ? (
          <RecentActivityTimeline leads={recentLeads} />
        ) : (
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border-2 border-dashed border-slate-300 p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No activity yet</h3>
              <p className="text-sm text-slate-600 mb-4">
                Get started by trying the demo chat to see how Desk.ai handles customer conversations
              </p>
              <div className="inline-flex items-center space-x-2 text-xs text-slate-500 mb-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-slate-200">
                  <svg className="w-3.5 h-3.5 mr-1.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Demo: 3 conversations yesterday
                </span>
              </div>
              <div>
                <a
                  href="/demo-chat"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Try Demo Chat
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Section Divider */}
      <div className="border-t border-slate-200 mb-8"></div>
      
      {/* Quick Actions */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-1">Quick Actions</h2>
          <p className="text-sm text-slate-500">Jump to common tasks</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickActionCard
            href="/dashboard/leads"
            icon={
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            title="View All Leads"
            subtitle="Manage customer inquiries"
          />
          <QuickActionCard
            href="/dashboard/calendar"
            icon={
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            title="Check Calendar"
            subtitle="View scheduled appointments"
          />
          <QuickActionCard
            href="/dashboard/settings"
            icon={
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            title="Settings"
            subtitle="Configure your business"
          />
        </div>
      </div>
    </Layout>
  );
}

// Protect with both auth and owner role check
export default withAuth(withOwnerAuth(Dashboard));
