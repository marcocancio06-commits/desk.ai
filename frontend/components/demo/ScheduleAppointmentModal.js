// ============================================================================
// SCHEDULE APPOINTMENT MODAL - Book jobs from qualified leads
// ============================================================================
// This modal allows business owners to schedule appointments when customers
// reach the ready_to_book state in the demo chat.
//
// HONEST COPY: Only promises what the system actually does:
// - Adds to appointments list (no fake SMS/email promises)
// - Optionally syncs to Google Calendar (if enabled)

import { useState } from 'react';

export default function ScheduleAppointmentModal({ 
  isOpen, 
  onClose, 
  defaultData = {},
  onSuccess 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('90'); // minutes
  const [notes, setNotes] = useState('');
  
  // Reset form when modal closes
  const handleClose = () => {
    setDate('');
    setTime('');
    setDuration('90');
    setNotes('');
    setError(null);
    setSuccess(false);
    onClose();
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!date || !time) {
        throw new Error('Date and time are required');
      }
      
      // Build appointment payload for demo endpoint
      const payload = {
        phone: defaultData.customerPhone || 'Unknown',
        issue: defaultData.issueSummary || 'No description',
        zipCode: defaultData.zipCode,
        preferredTime: defaultData.preferredTimeText,
        urgency: defaultData.urgency || 'normal',
        date,
        time,
        duration,
        notes: notes || undefined
      };
      
      // Send to backend - use demo endpoint (no auth required)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://growzone-dobi-production.up.railway.app';
      const response = await fetch(`${backendUrl}/api/demo/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(data.error || 'Failed to create appointment');
      }
      
      // Show success
      setSuccess(true);
      
      // Notify parent
      if (onSuccess) {
        onSuccess(data.data);
      }
      
      // Close after delay
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Don't render if not open
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Schedule Job
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Job Scheduled!
              </h3>
              <p className="text-sm text-gray-600">
                This appointment has been added to your jobs list.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Info (readonly) */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Customer Information
                </h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {defaultData.customerPhone || 'N/A'}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-gray-600">ZIP:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {defaultData.zipCode || 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-600 text-sm">Issue:</span>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {defaultData.issueSummary || 'No description'}
                  </p>
                </div>
                
                {defaultData.preferredTimeText && (
                  <div>
                    <span className="text-gray-600 text-sm">Customer prefers:</span>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {defaultData.preferredTimeText}
                    </p>
                  </div>
                )}
                
                {defaultData.urgency && (
                  <div>
                    <span className="text-gray-600 text-sm">Urgency:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      defaultData.urgency === 'emergency' ? 'bg-red-100 text-red-800' :
                      defaultData.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {defaultData.urgency}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Scheduling */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  Schedule Details
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      id="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                  </label>
                  <select
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                    <option value="180">3 hours</option>
                    <option value="240">4 hours</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Internal Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Add any internal notes about this job..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              
              {/* Info message */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-xs text-blue-800">
                  ℹ️ This will add the job to your appointments list. You'll need to contact the customer separately to confirm the time.
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Scheduling...' : 'Schedule Job'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
