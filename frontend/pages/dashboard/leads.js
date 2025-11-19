import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import PageHeader from '../../components/dashboard/PageHeader';
import EmptyState from '../../components/dashboard/EmptyState';
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
          <div className="text-gray-500">Loading leads...</div>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <PageHeader title="Leads" subtitle="Manage customer inquiries" />
        <div className="mt-8">
          <EmptyState
            icon="⚠️"
            title="Failed to load leads"
            subtitle={`${error}. Make sure the backend server is running on ${BACKEND_URL}`}
          />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <PageHeader title="Leads" subtitle="Manage customer inquiries" />
      
      {/* Pill Filter Tabs */}
      <div className="mt-6 mb-6">
        <div className="flex flex-wrap gap-2">
          {filters.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              {label}
              <span className={`ml-1.5 ${filter === key ? 'text-blue-100' : 'text-gray-500'}`}>
                ({count})
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Leads Table */}
      {filteredLeads.length === 0 ? (
        <EmptyState
          icon="📭"
          title="No leads found"
          subtitle={
            filter === 'all' 
              ? 'No leads have been generated yet. When customers contact you, they\'ll appear here.' 
              : `No leads with status "${filter.replace('_', ' ')}".`
          }
          action={
            filter === 'all' ? (
              <a
                href="/demo-chat"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Demo Chat
              </a>
            ) : null
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
