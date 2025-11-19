import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import PageHeader from '../../components/dashboard/PageHeader';
import EmptyState from '../../components/dashboard/EmptyState';
import StatusBadge from '../../components/dashboard/StatusBadge';
import UrgencyBadge from '../../components/dashboard/UrgencyBadge';
import { BACKEND_URL } from '../../lib/config';

export default function Calendar() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  // Fetch appointments on mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/appointments`);
      const data = await response.json();
      
      if (data.ok) {
        setAppointments(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    setUpdatingId(appointmentId);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        // Update local state
        setAppointments(prev => 
          prev.map(apt => 
            apt.id === appointmentId 
              ? { ...apt, status: newStatus, updatedAt: new Date().toISOString() }
              : apt
          )
        );
      } else {
        alert(`Failed to update: ${data.error}`);
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
      alert('Failed to update appointment');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter appointments by status
  const filteredAppointments = statusFilter === 'all' 
    ? appointments 
    : appointments.filter(apt => apt.status === statusFilter);

  // Count by status
  const counts = {
    all: appointments.length,
    new: appointments.filter(a => a.status === 'new').length,
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length
  };

  // Group appointments by date
  const groupedAppointments = filteredAppointments.reduce((groups, apt) => {
    let dateKey;
    if (apt.scheduledStart) {
      const date = new Date(apt.scheduledStart);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Reset time parts for comparison
      today.setHours(0, 0, 0, 0);
      tomorrow.setHours(0, 0, 0, 0);
      const aptDate = new Date(date);
      aptDate.setHours(0, 0, 0, 0);
      
      if (aptDate.getTime() === today.getTime()) {
        dateKey = 'Today';
      } else if (aptDate.getTime() === tomorrow.getTime()) {
        dateKey = 'Tomorrow';
      } else {
        dateKey = date.toLocaleDateString('en-US', { 
          weekday: 'short',
          month: 'short', 
          day: 'numeric',
          year: aptDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }
    } else {
      dateKey = 'Time TBD';
    }
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(apt);
    return groups;
  }, {});

  // Sort date keys
  const sortedDateKeys = Object.keys(groupedAppointments).sort((a, b) => {
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Tomorrow') return -1;
    if (b === 'Tomorrow') return 1;
    if (a === 'Time TBD') return 1;
    if (b === 'Time TBD') return -1;
    
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA - dateB;
  });

  const filters = [
    { key: 'all', label: 'All Jobs', count: counts.all },
    { key: 'new', label: 'New', count: counts.new },
    { key: 'scheduled', label: 'Scheduled', count: counts.scheduled },
    { key: 'completed', label: 'Completed', count: counts.completed },
    { key: 'cancelled', label: 'Cancelled', count: counts.cancelled }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading appointments...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <PageHeader title="Appointments" subtitle="View and manage your scheduled jobs" />
        <div className="mt-8">
          <EmptyState
            icon="⚠️"
            title="Failed to load appointments"
            subtitle={error}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader title="Appointments" subtitle="View and manage your scheduled jobs" />
      
      {/* Pill Filter Tabs */}
      <div className="mt-6 mb-6">
        <div className="flex flex-wrap gap-2">
          {filters.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                statusFilter === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              {label}
              <span className={`ml-1.5 ${statusFilter === key ? 'text-blue-100' : 'text-gray-500'}`}>
                ({count})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Appointments Timeline */}
      {filteredAppointments.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No appointments found"
          subtitle={
            statusFilter === 'all' 
              ? "You don't have any appointments yet. Try the demo chat to create one!"
              : `No appointments with status "${statusFilter}"`
          }
          action={
            statusFilter !== 'all' ? (
              <button
                onClick={() => setStatusFilter('all')}
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View all appointments
              </button>
            ) : (
              <a
                href="/demo-chat"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Demo Chat
              </a>
            )
          }
        />
      ) : (
        <div className="space-y-8">
          {sortedDateKeys.map(dateKey => (
            <div key={dateKey}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📅</span>
                {dateKey}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({groupedAppointments[dateKey].length})
                </span>
              </h3>
              <div className="space-y-3">
                {groupedAppointments[dateKey].map(apt => (
                  <div 
                    key={apt.id}
                    className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start space-x-3">
                          <div className="flex-1">
                            <h4 className="text-base font-medium text-gray-900 mb-1">
                              {apt.issueSummary}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {apt.customerPhone}
                              </span>
                              {apt.zipCode && (
                                <span className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {apt.zipCode}
                                </span>
                              )}
                              {apt.scheduledStart && (
                                <span className="flex items-center font-medium text-blue-600">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {new Date(apt.scheduledStart).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <StatusBadge status={apt.status} size="sm" />
                              {apt.urgency && <UrgencyBadge urgency={apt.urgency} size="sm" />}
                              {apt.eventId && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Calendar Synced
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <select
                          value={apt.status}
                          onChange={(e) => handleStatusUpdate(apt.id, e.target.value)}
                          disabled={updatingId === apt.id}
                          className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="new">New</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      {!loading && !error && appointments.length > 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">About appointments</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Appointments are created when customers are ready to book in the demo chat. 
                  You'll need to contact customers separately to confirm appointment times.
                  {appointments.some(a => a.eventId) && (
                    <span className="block mt-1">
                      ✅ Appointments with the "Calendar Synced" badge are synced to your Google Calendar.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
