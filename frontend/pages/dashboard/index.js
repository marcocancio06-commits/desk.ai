import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import StatCard from './components/StatCard';
import LeadTable from './components/LeadTable';
import { BACKEND_URL, DEFAULT_BUSINESS_ID } from '../../lib/config';

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Fetch leads from backend API
    fetch(`${BACKEND_URL}/api/leads?businessId=${DEFAULT_BUSINESS_ID}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch leads: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setLeads(data.leads || []);
        setStats(data.stats);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching leads:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);
  
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
  
  if (loading) {
    return (
      <Layout title="Dashboard" subtitle="Overview of your business activity">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout title="Dashboard" subtitle="Overview of your business activity">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load dashboard</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <p className="text-sm text-gray-400">
              Make sure the backend server is running on {BACKEND_URL}
            </p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="Dashboard" subtitle="Overview of your business activity">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="New Leads Today"
          value={todayLeads.length}
          subtitle={`${leads.length} total leads`}
          icon="📈"
          color="blue"
        />
        <StatCard
          title="Collecting Info"
          value={collectingInfo}
          subtitle="Gathering details"
          icon="💬"
          color="yellow"
        />
        <StatCard
          title="Qualified"
          value={qualified}
          subtitle="Ready to schedule"
          icon="✅"
          color="green"
        />
        <StatCard
          title="Scheduled"
          value={scheduled}
          subtitle="Booked appointments"
          icon="�"
          color="purple"
        />
      </div>
      
      {/* Recent Activity */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <a href="/dashboard/leads" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all →
          </a>
        </div>
        <LeadTable leads={recentLeads} />
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/dashboard/leads"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl mr-3">👥</span>
            <div>
              <div className="font-medium text-gray-900">View All Leads</div>
              <div className="text-sm text-gray-500">Manage customer inquiries</div>
            </div>
          </a>
          <a
            href="/dashboard/calendar"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl mr-3">📅</span>
            <div>
              <div className="font-medium text-gray-900">Check Calendar</div>
              <div className="text-sm text-gray-500">View scheduled appointments</div>
            </div>
          </a>
          <a
            href="/dashboard/settings"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl mr-3">⚙️</span>
            <div>
              <div className="font-medium text-gray-900">Settings</div>
              <div className="text-sm text-gray-500">Configure your business</div>
            </div>
          </a>
        </div>
      </div>
    </Layout>
  );
}
