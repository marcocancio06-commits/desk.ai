import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import EmptyState from '../../components/ui/EmptyState';
import LeadTable from './components/LeadTable';
import LeadDetailModal from './components/LeadDetailModal';
import QuickActionsBar from '../../components/ui/QuickActionsBar';
import { RefreshCw, Filter } from 'lucide-react';
import { BACKEND_URL, DEFAULT_BUSINESS_ID } from '../../lib/config';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const fetchLeads = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/leads?businessId=${DEFAULT_BUSINESS_ID}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch leads: ${res.status}`);
      }
      const data = await res.json();
      setLeads(data.leads || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLeads();
  };
  
  // Get all unique tags from leads
  const allTags = [...new Set(leads.flatMap(lead => lead.tags || []))];
  
  // Filter leads based on selected status and tag filters
  let filteredLeads = filter === 'all' 
    ? leads 
    : leads.filter(lead => lead.status === filter);

  if (tagFilter !== 'all') {
    filteredLeads = filteredLeads.filter(lead => 
      (lead.tags || []).includes(tagFilter)
    );
  }
  
  // Handle lead update from modal
  const handleLeadUpdate = () => {
    fetchLeads();
  };
  
  // Handle row click to open modal
  const handleLeadClick = (leadId) => {
    setSelectedLeadId(leadId);
    setModalOpen(true);
  };
  
  // Handle closing modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedLeadId(null);
  };
  
  const statusCounts = {
    all: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    collecting_info: leads.filter(l => l.status === 'collecting_info').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    scheduled: leads.filter(l => l.status === 'scheduled').length,
    closed_won: leads.filter(l => l.status === 'closed_won').length,
    closed_lost: leads.filter(l => l.status === 'closed_lost').length,
  };
  
  const filters = [
    { key: 'all', label: 'All Leads', count: statusCounts.all },
    { key: 'new', label: 'New', count: statusCounts.new },
    { key: 'collecting_info', label: 'Collecting Info', count: statusCounts.collecting_info },
    { key: 'qualified', label: 'Qualified', count: statusCounts.qualified },
    { key: 'scheduled', label: 'Scheduled', count: statusCounts.scheduled },
    { key: 'closed_won', label: 'Closed Won', count: statusCounts.closed_won },
  ];
  
  if (loading) {
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Leads</h1>
            <p className="text-slate-600">Manage customer inquiries</p>
          </div>
        </div>
        <EmptyState
          icon={
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          title="Failed to load leads"
          subtitle={`${error}. Make sure the backend server is running on ${BACKEND_URL}`}
        />
      </Layout>
    );
  }
  
  return (
    <Layout>
      {/* Enhanced Gradient Header */}
      <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-transparent -m-8 p-8 mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
              Leads
            </h1>
            <p className="text-slate-600">Manage customer inquiries and pipeline</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="group flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 bg-white/90 backdrop-blur-sm border border-slate-300/50 rounded-full hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {/* Quick Actions */}
      <QuickActionsBar 
        actions={[
          {
            label: 'Create Manual Lead',
            onClick: () => alert('Manual lead creation coming soon!'),
            variant: 'primary',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )
          },
          {
            label: 'Try Demo Chat',
            onClick: () => window.location.href = '/demo-chat',
            variant: 'secondary',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            )
          }
        ]}
      />
      
      {/* Status Filter Tabs */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 -mx-8 px-8 py-4 mb-6 border-b border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-3 mb-4">
          {filters.map(({ key, label, count }) => {
            const colorMap = {
              all: 'text-slate-700',
              new: 'text-slate-700',
              collecting_info: 'text-yellow-700',
              qualified: 'text-green-700',
              scheduled: 'text-blue-700',
              closed_won: 'text-violet-700'
            };
            
            const bgColorMap = {
              all: 'bg-slate-100',
              new: 'bg-slate-100',
              collecting_info: 'bg-yellow-100',
              qualified: 'bg-green-100',
              scheduled: 'bg-blue-100',
              closed_won: 'bg-violet-100'
            };
            
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`group px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  filter === key
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-blue-400 hover:shadow-md hover:scale-105'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{label}</span>
                  <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold ${
                    filter === key 
                      ? 'bg-white/20 text-white' 
                      : `${bgColorMap[key]} ${colorMap[key]}`
                  }`}>
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Tags:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTagFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  tagFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    tagFilter === tag
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}
                >
                  {tag.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Leads Table */}
      {filteredLeads.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          }
          title="No leads found"
          subtitle={
            filter === 'all' && tagFilter === 'all'
              ? 'No leads have been generated yet. Use the demo chat to create your first lead.' 
              : `No leads matching selected filters.`
          }
          action={
            filter === 'all' && tagFilter === 'all' ? (
              <a
                href="/demo-chat"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Try Demo Chat
              </a>
            ) : (
              <button
                onClick={() => {
                  setFilter('all');
                  setTagFilter('all');
                }}
                className="inline-flex items-center px-6 py-3 bg-slate-600 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Clear all filters
              </button>
            )
          }
        />
      ) : (
        <LeadTable leads={filteredLeads} onLeadClick={handleLeadClick} />
      )}
      
      {/* Lead Detail Modal */}
      <LeadDetailModal 
        leadId={selectedLeadId}
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onUpdate={handleLeadUpdate}
      />
    </Layout>
  );
}
