import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import LeadTable from './components/LeadTable';
import { BACKEND_URL, DEFAULT_BUSINESS_ID } from '../../lib/config';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  
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
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching leads:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);
  
  // Filter leads based on selected filter
  const filteredLeads = filter === 'all' 
    ? leads 
    : leads.filter(lead => lead.status === filter);
  
  const statusCounts = {
    all: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    collecting_info: leads.filter(l => l.status === 'collecting_info').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    scheduled: leads.filter(l => l.status === 'scheduled').length,
    closed_won: leads.filter(l => l.status === 'closed_won').length,
    closed_lost: leads.filter(l => l.status === 'closed_lost').length,
  };
  
  if (loading) {
    return (
      <Layout title="Leads" subtitle="Manage customer inquiries">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading leads...</div>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout title="Leads" subtitle="Manage customer inquiries">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load leads</h3>
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
    <Layout title="Leads" subtitle="Manage customer inquiries">
      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setFilter('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                filter === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Leads
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100">
                {statusCounts.all}
              </span>
            </button>
            <button
              onClick={() => setFilter('new')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                filter === 'new'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              New
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-blue-100 text-blue-800">
                {statusCounts.new}
              </span>
            </button>
            <button
              onClick={() => setFilter('collecting_info')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                filter === 'collecting_info'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Collecting Info
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-yellow-100 text-yellow-800">
                {statusCounts.collecting_info}
              </span>
            </button>
            <button
              onClick={() => setFilter('qualified')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                filter === 'qualified'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Qualified
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-green-100 text-green-800">
                {statusCounts.qualified}
              </span>
            </button>
            <button
              onClick={() => setFilter('scheduled')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                filter === 'scheduled'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Scheduled
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-purple-100 text-purple-800">
                {statusCounts.scheduled}
              </span>
            </button>
            <button
              onClick={() => setFilter('closed_won')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                filter === 'closed_won'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Closed Won
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-green-100 text-green-800">
                {statusCounts.closed_won}
              </span>
            </button>
          </nav>
        </div>
      </div>
      
      {/* Leads Table */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📭</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
          <p className="text-gray-500">
            {filter === 'all' 
              ? 'No leads have been generated yet.'
              : `No leads with status "${filter.replace('_', ' ')}".`
            }
          </p>
        </div>
      ) : (
        <LeadTable leads={filteredLeads} />
      )}
    </Layout>
  );
}
