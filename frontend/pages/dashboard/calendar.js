import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import EmptyState from '../../components/ui/EmptyState';
import StatusPill from '../../components/ui/StatusPill';
import UrgencyBadge from '../../components/ui/UrgencyBadge';
import QuickActionsBar from '../../components/ui/QuickActionsBar';
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Appointments</h1>
            <p className="text-slate-600">View and manage your scheduled jobs</p>
          </div>
        </div>
        <EmptyState
          icon={
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          title="Failed to load appointments"
          subtitle={error}
        />
      </Layout>
    );
  }
  
  return (
    <Layout>
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50 -m-8 p-8 mb-8 border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Appointments</h1>
          <p className="text-slate-600">View and manage your scheduled jobs</p>
        </div>
      </div>
      
      {/* Quick Actions */}
      <QuickActionsBar 
        actions={[
          {
            label: 'Create Manual Appointment',
            onClick: () => alert('Manual appointment creation coming soon!'),
            variant: 'primary',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )
          }
        ]}
      />
      
      {/* Enhanced Pill Filter Tabs */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3">
          {filters.map(({ key, label, count }) => {
            const colorMap = {
              all: 'text-slate-700',
              new: 'text-slate-700',
              scheduled: 'text-blue-700',
              completed: 'text-green-700',
              cancelled: 'text-red-700'
            };
            
            const bgColorMap = {
              all: 'bg-slate-100',
              new: 'bg-slate-100',
              scheduled: 'bg-blue-100',
              completed: 'bg-green-100',
              cancelled: 'bg-red-100'
            };
            
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`group px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  statusFilter === key
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-blue-400 hover:shadow-md hover:scale-105'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{label}</span>
                  <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold ${
                    statusFilter === key 
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

      {/* Appointments Timeline */}
      {filteredAppointments.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 10l2 2 6-6" opacity="0.5" />
            </svg>
          }
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
                className="inline-flex items-center px-6 py-3 bg-slate-600 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                View all appointments
              </button>
            ) : (
              <a
                href="/demo-chat"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Try Demo Chat
              </a>
            )
          }
        />
      ) : (
        <div className="space-y-10">
          {sortedDateKeys.map(dateKey => (
            <div key={dateKey} className="animate-fadeIn">
              <div className="flex items-center mb-6">
                <div className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-md">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {dateKey}
                  <span className="ml-2.5 px-2 py-0.5 bg-white/30 rounded-full text-xs font-bold">
                    {groupedAppointments[dateKey].length}
                  </span>
                </div>
                <div className="flex-1 ml-4 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-100 to-transparent"></div>
              </div>
              <div className="space-y-4">
                {groupedAppointments[dateKey].map(apt => (
                  <div 
                    key={apt.id}
                    className="group bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-blue-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start space-x-3">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                              {apt.issueSummary}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-600 mb-4">
                              <span className="flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span className="font-medium">{apt.customerPhone}</span>
                              </span>
                              {apt.zipCode && (
                                <span className="flex items-center">
                                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {apt.zipCode}
                                </span>
                              )}
                              {apt.scheduledStart && (
                                <span className="flex items-center font-semibold text-blue-600">
                                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            <div className="flex items-center gap-3">
                              <StatusPill status={apt.status} size="sm" />
                              <UrgencyBadge urgency={apt.urgency} size="sm" />
                              {apt.eventId && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                                  <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Calendar Synced
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-6">
                        <select
                          value={apt.status}
                          onChange={(e) => handleStatusUpdate(apt.id, e.target.value)}
                          disabled={updatingId === apt.id}
                          className="text-sm border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-shadow"
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
        <div className="mt-10 bg-blue-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-bold text-blue-900 mb-1">About appointments</h3>
              <div className="text-sm text-blue-700 leading-relaxed">
                <p>
                  Appointments are created when customers are ready to book in the demo chat. 
                  You'll need to contact customers separately to confirm appointment times.
                  {appointments.some(a => a.eventId) && (
                    <span className="block mt-2 font-semibold">
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