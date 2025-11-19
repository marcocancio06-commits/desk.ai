import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import EmptyState from '../../components/ui/EmptyState';
import LeadTable from './components/LeadTable';
import LeadDetailPanel from '../../components/dashboard/LeadDetailPanel';
import { BACKEND_URL, DEFAULT_BUSINESS_ID } from '../../lib/config';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  
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
  
  // Get selected lead object
  const selectedLead = selectedLeadId 
    ? leads.find(lead => lead.id === selectedLeadId)
    : null;
  
  // Handle lead update from detail panel
  const handleLeadUpdate = (updatedLead) => {
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === updatedLead.id ? updatedLead : lead
      )
    );
  };
  
  // Handle row click to open detail panel
  const handleLeadClick = (leadId) => {
    setSelectedLeadId(leadId);
  };
  
  // Handle closing detail panel
  const handleClosePanel = () => {
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
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50 -m-8 p-8 mb-8 border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Leads</h1>
          <p className="text-slate-600">Manage customer inquiries and pipeline</p>
        </div>
      </div>
      
      {/* Enhanced Pill Filter Tabs with Status Indicators */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3">
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
            filter === 'all' 
              ? 'No leads have been generated yet. Use the demo chat to create your first lead.' 
              : `No leads with status "${filter.replace('_', ' ')}".`
          }
          action={
            filter === 'all' ? (
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
                onClick={() => setFilter('all')}
                className="inline-flex items-center px-6 py-3 bg-slate-600 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                View all leads
              </button>
            )
          }
        />
      ) : (
        <LeadTable leads={filteredLeads} onLeadClick={handleLeadClick} />
      )}
      
      {/* Lead Detail Panel */}
      {selectedLead && (
        <LeadDetailPanel 
          lead={selectedLead}
          onClose={handleClosePanel}
          onUpdate={handleLeadUpdate}
        />
      )}
    </Layout>
  );
}
