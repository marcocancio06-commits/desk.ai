// ============================================================================
// DEMO DASHBOARD - Simplified single-tenant dashboard (no auth required)
// ============================================================================
// This dashboard shows leads for the demo business without requiring login.
// Perfect for Loom recordings and client demos.
// ============================================================================

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { DEMO_BUSINESS, BACKEND_URL } from '../../config/demoConfig';
import DemoNav from '../../components/demo/DemoNav';

export default function DemoDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch leads for this specific business using the demo endpoint
      const response = await fetch(`${BACKEND_URL}/api/demo/leads?businessId=${DEMO_BUSINESS.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leads: ${response.status}`);
      }
      
      const data = await response.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    total: leads.length,
    readyToBook: leads.filter(l => l.booking_intent === 'ready_to_book').length,
    today: leads.filter(l => {
      const leadDate = new Date(l.created_at);
      return leadDate.toDateString() === new Date().toDateString();
    }).length,
    thisWeek: leads.filter(l => {
      const leadDate = new Date(l.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return leadDate > weekAgo;
    }).length
  };

  return (
    <>
      <Head>
        <title>Dashboard | {DEMO_BUSINESS.name}</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <DemoNav currentPage="dashboard" />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
            <p className="text-gray-600 mt-1">
              View and manage leads from your AI assistant
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500 font-medium">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500 font-medium">Ready to Book</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.readyToBook}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500 font-medium">Today</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.today}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500 font-medium">This Week</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.thisWeek}</p>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">
                <strong>Error:</strong> {error}
              </p>
              <button 
                onClick={fetchLeads}
                className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Try again →
              </button>
            </div>
          )}

          {/* Leads Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Recent Leads</h2>
              <button 
                onClick={fetchLeads}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-3 text-gray-500">Loading leads...</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">No leads yet</p>
                <p className="text-gray-400 text-sm mt-1">Try the demo chat to create a test lead</p>
                <Link 
                  href="/demo-chat/owner" 
                  className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Open Demo Chat →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service Needed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Urgency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leads.map((lead) => (
                      <tr 
                        key={lead.id} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors" 
                        onClick={() => setSelectedLead(lead)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {lead.phone || lead.customer_phone || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {lead.zip_code || lead.zipCode || ''}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {lead.issue_summary || lead.issueSummary || 'Not specified'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            lead.booking_intent === 'ready_to_book' 
                              ? 'bg-green-100 text-green-800'
                              : lead.booking_intent === 'collecting_info'
                              ? 'bg-yellow-100 text-yellow-800'
                              : lead.booking_intent === 'qualified'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {(lead.booking_intent || 'new').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            lead.urgency === 'emergency' 
                              ? 'bg-red-100 text-red-800'
                              : lead.urgency === 'high'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {lead.urgency || 'normal'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lead.created_at 
                            ? new Date(lead.created_at).toLocaleString() 
                            : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <h3 className="font-semibold text-lg mb-2">Test Your AI Assistant</h3>
              <p className="text-blue-100 text-sm mb-4">
                Try the demo chat to see how your AI handles customer inquiries
              </p>
              <Link 
                href="/demo-chat/owner"
                className="inline-block px-4 py-2 bg-white text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors"
              >
                Open Demo Chat →
              </Link>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <h3 className="font-semibold text-lg mb-2">Customer Experience</h3>
              <p className="text-purple-100 text-sm mb-4">
                See what your customers see when they reach out
              </p>
              <Link 
                href="/demo-chat/customer"
                className="inline-block px-4 py-2 bg-white text-purple-600 text-sm font-medium rounded-lg hover:bg-purple-50 transition-colors"
              >
                View Customer Chat →
              </Link>
            </div>
          </div>
        </main>

        {/* Lead Detail Modal */}
        {selectedLead && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Lead Details</h3>
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Phone</label>
                  <p className="text-gray-900">{selectedLead.phone || selectedLead.customer_phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">ZIP Code</label>
                  <p className="text-gray-900">{selectedLead.zip_code || selectedLead.zipCode || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Service Needed</label>
                  <p className="text-gray-900">{selectedLead.issue_summary || selectedLead.issueSummary || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Preferred Time</label>
                  <p className="text-gray-900">{selectedLead.preferred_time || selectedLead.preferredTime || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                    <p className="text-gray-900">{(selectedLead.booking_intent || 'new').replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Urgency</label>
                    <p className="text-gray-900">{selectedLead.urgency || 'normal'}</p>
                  </div>
                </div>
                {selectedLead.internal_notes && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">AI Notes</label>
                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded mt-1">{selectedLead.internal_notes}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Created</label>
                  <p className="text-gray-900">
                    {selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="p-6 border-t bg-gray-50">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
