import { useState } from 'react';
import { BACKEND_URL, DEFAULT_BUSINESS_ID } from '../../lib/config';

export default function LeadDetailPanel({ lead, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    status: lead?.status || 'new',
    urgency: lead?.urgency || 'normal',
    scheduledTime: lead?.scheduledTime || '',
    ownerNotes: lead?.ownerNotes || ''
  });
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  
  if (!lead) return null;
  
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear success/error when user makes changes
    setSaveSuccess(false);
    setSaveError(null);
  };
  
  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: DEFAULT_BUSINESS_ID,
          status: formData.status,
          urgency: formData.urgency,
          scheduledTime: formData.scheduledTime || null,
          ownerNotes: formData.ownerNotes || null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update lead');
      }
      
      const data = await response.json();
      
      // Show success message
      setSaveSuccess(true);
      
      // Notify parent component to update the lead in the list
      if (onUpdate) {
        onUpdate(data.lead);
      }
      
      // Hide success message after 2 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error saving lead:', error);
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const getUrgencyColor = (urgency) => {
    const colors = {
      low: 'text-gray-600',
      normal: 'text-blue-600',
      high: 'text-orange-600',
      emergency: 'text-red-600'
    };
    return colors[urgency] || 'text-gray-600';
  };
  
  return (
    <div className="fixed inset-y-0 right-0 max-w-full flex z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative w-screen max-w-2xl">
        <div className="h-full flex flex-col bg-white shadow-xl overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-6 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">
                  Lead Details
                </h2>
                <p className="mt-1 text-sm text-blue-100">
                  {lead.phone}
                </p>
              </div>
              <button
                onClick={onClose}
                className="ml-3 bg-blue-500 rounded-md p-2 inline-flex items-center justify-center text-white hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <span className="sr-only">Close panel</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 px-6 py-6 space-y-6">
            {/* Read-only Information */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Customer Information
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Customer Name</label>
                  <p className="mt-1 text-sm text-gray-900">{lead.customerName || 'Not provided'}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{lead.phone}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500">Zip Code</label>
                  <p className="mt-1 text-sm text-gray-900">{lead.zipCode || 'Not provided'}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500">Source</label>
                  <p className="mt-1 text-sm text-gray-900">{lead.source || 'web_chat'}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500">Issue Summary</label>
                <p className="mt-1 text-sm text-gray-900">{lead.issueSummary || lead.lastMessage || 'No details provided'}</p>
              </div>
              
              {lead.preferredTime && (
                <div>
                  <label className="block text-xs font-medium text-gray-500">Customer Preferred Time</label>
                  <p className="mt-1 text-sm text-gray-900">{lead.preferredTime}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Created</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(lead.createdAt)}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(lead.updatedAt)}</p>
                </div>
              </div>
            </div>
            
            {/* Editable Fields */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Lead Management
              </h3>
              
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                >
                  <option value="new">New</option>
                  <option value="collecting_info">Collecting Info</option>
                  <option value="qualified">Qualified</option>
                  <option value="quoted">Quoted</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="closed_won">Closed Won</option>
                  <option value="closed_lost">Closed Lost</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Current stage in the lead pipeline
                </p>
              </div>
              
              {/* Urgency */}
              <div>
                <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency *
                </label>
                <select
                  id="urgency"
                  value={formData.urgency}
                  onChange={(e) => handleChange('urgency', e.target.value)}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border font-medium ${getUrgencyColor(formData.urgency)}`}
                >
                  <option value="low">Low - Can wait</option>
                  <option value="normal">Normal - Standard priority</option>
                  <option value="high">High - Needs attention soon</option>
                  <option value="emergency">Emergency - Immediate response</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Priority level for this lead
                </p>
              </div>
              
              {/* Scheduled Time */}
              <div>
                <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Appointment Time
                </label>
                <input
                  type="datetime-local"
                  id="scheduledTime"
                  value={formData.scheduledTime ? new Date(formData.scheduledTime).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleChange('scheduledTime', e.target.value ? new Date(e.target.value).toISOString() : '')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                />
                <p className="mt-1 text-xs text-gray-500">
                  When the job is scheduled to be completed
                </p>
              </div>
              
              {/* Owner Notes */}
              <div>
                <label htmlFor="ownerNotes" className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Notes
                </label>
                <textarea
                  id="ownerNotes"
                  rows={6}
                  value={formData.ownerNotes}
                  onChange={(e) => handleChange('ownerNotes', e.target.value)}
                  placeholder="Add private notes about this lead..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Private notes visible only to you (not shared with customer)
                </p>
              </div>
            </div>
            
            {/* Conversation History */}
            {lead.messages && lead.messages.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                  Conversation History
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {lead.messages.map((msg, idx) => (
                    <div key={idx} className={`p-3 rounded-lg ${msg.from === 'customer' ? 'bg-white border border-gray-200' : 'bg-blue-50'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-900">
                          {msg.from === 'customer' ? '👤 Customer' : '🤖 Assistant'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer - Save Button */}
          <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200">
            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  ⚠️ {saveError}
                </p>
              </div>
            )}
            
            {saveSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  ✅ Changes saved successfully!
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
