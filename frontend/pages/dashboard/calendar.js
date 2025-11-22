import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, addHours, setHours, setMinutes } from 'date-fns';
import { enUS } from 'date-fns/locale';
import Layout from './components/Layout';
import { BACKEND_URL, DEFAULT_BUSINESS_ID } from '../../lib/config';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

function AppointmentModal({ appointment, onClose, onSave, onDelete }) {
  const [formData, setFormData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    notes: '',
    urgency: '',
    status: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (appointment) {
      setFormData({
        scheduledDate: appointment.scheduled_date || '',
        scheduledTime: appointment.scheduled_time || '',
        notes: appointment.notes || '',
        urgency: appointment.urgency || 'normal',
        status: appointment.status || 'pending'
      });
    }
  }, [appointment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(appointment.id, formData);
      onClose();
    } catch (error) {
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (!appointment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Appointment Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Conflict Warning Banner */}
          {appointment.has_conflict && (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h3 className="font-bold text-yellow-900 mb-1">⚠️ Scheduling Conflict Detected</h3>
                  <p className="text-sm text-yellow-800">
                    This appointment overlaps with events in your Google Calendar. 
                    Check your calendar to resolve the conflict.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Issue Summary</label>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-slate-900">{appointment.issue_summary}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Customer Phone</label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-slate-900">{appointment.customer_phone}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Zip Code</label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-slate-900">{appointment.zip_code || 'N/A'}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Time</label>
              <input
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Urgency</label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">🟢 Normal</option>
                <option value="high">🟠 High Priority</option>
                <option value="emergency">🔴 Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Internal Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
              placeholder="Add notes..."
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t gap-3">
            <button
              type="button"
              onClick={() => {
                if (confirm('Delete this appointment?')) {
                  onDelete(appointment.id);
                  onClose();
                }
              }}
              className="px-4 py-2 text-red-600 hover:text-red-700 font-semibold"
            >
              Delete
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('week');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const url = BACKEND_URL + '/api/appointments?businessId=' + encodeURIComponent(DEFAULT_BUSINESS_ID);
      const response = await fetch(url);
      const data = await response.json();
      if (data.ok) {
        setAppointments(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const events = useMemo(() => {
    return appointments
      .filter(apt => apt.scheduled_date && apt.scheduled_time)
      .map(apt => {
        const [hours, minutes] = apt.scheduled_time.split(':');
        const start = setMinutes(setHours(new Date(apt.scheduled_date), parseInt(hours)), parseInt(minutes));
        const end = addHours(start, 1);
        const customerPhone = apt.customer_phone || apt.leads?.phone || 'Unknown';
        const issueSummary = apt.issue_summary || apt.leads?.issue_summary || 'Appointment';
        const zipCode = apt.zip_code || apt.leads?.zip_code;
        const urgency = apt.urgency || apt.leads?.urgency || 'normal';
        const hasConflict = apt.has_conflict || false;
        return {
          id: apt.id,
          title: issueSummary,
          start,
          end,
          resource: { ...apt, customer_phone: customerPhone, issue_summary: issueSummary, zip_code: zipCode, urgency, has_conflict: hasConflict },
        };
      });
  }, [appointments]);

  const handleSelectEvent = useCallback((event) => {
    setSelectedAppointment(event.resource);
    setShowModal(true);
  }, []);

  const handleEventDrop = async ({ event, start }) => {
    const scheduledDate = format(start, 'yyyy-MM-dd');
    const scheduledTime = format(start, 'HH:mm');
    try {
      const url = BACKEND_URL + '/api/appointments/' + event.id;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledDate, scheduledTime }),
      });
      const data = await response.json();
      if (data.ok) {
        setAppointments(prev =>
          prev.map(apt =>
            apt.id === event.id ? { ...apt, scheduled_date: scheduledDate, scheduled_time: scheduledTime } : apt
          )
        );
      } else {
        alert('Failed: ' + data.error);
        fetchAppointments();
      }
    } catch (error) {
      alert('Failed to reschedule');
      fetchAppointments();
    }
  };

  const handleSaveAppointment = async (appointmentId, formData) => {
    const url = BACKEND_URL + '/api/appointments/' + appointmentId;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        internalNotes: formData.notes,
        urgency: formData.urgency,
        status: formData.status,
      }),
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.error);
    setAppointments(prev =>
      prev.map(apt =>
        apt.id === appointmentId
          ? { ...apt, scheduled_date: formData.scheduledDate, scheduled_time: formData.scheduledTime, notes: formData.notes, urgency: formData.urgency, status: formData.status }
          : apt
      )
    );
  };

  const handleDeleteAppointment = async (appointmentId) => {
    const url = BACKEND_URL + '/api/appointments/' + appointmentId;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    const data = await response.json();
    if (data.ok) {
      setAppointments(prev => prev.map(apt => (apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt)));
    }
  };

  const eventStyleGetter = (event) => {
    const apt = event.resource;
    let backgroundColor = '#10b981';
    let borderColor = '#059669';
    
    if (apt.urgency === 'emergency') {
      backgroundColor = '#ef4444';
      borderColor = '#dc2626';
    } else if (apt.urgency === 'high') {
      backgroundColor = '#f97316';
      borderColor = '#ea580c';
    }
    
    if (apt.status === 'completed' || apt.status === 'cancelled') {
      backgroundColor = '#94a3b8';
      borderColor = '#64748b';
    }
    
    // Add conflict styling - yellow warning border
    if (apt.has_conflict) {
      borderColor = '#eab308';
      borderWidth = '3px';
      borderStyle = 'dashed';
    }
    
    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: apt.has_conflict ? '3px' : '2px',
        borderStyle: apt.has_conflict ? 'dashed' : 'solid',
        borderRadius: '6px',
        color: 'white',
        fontWeight: '600',
        fontSize: '14px',
        padding: '4px 8px',
        position: 'relative',
      },
    };
  };

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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">Error: {error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-to-r from-blue-50 via-white to-blue-50 -m-8 p-8 mb-8 border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Calendar</h1>
          <p className="text-slate-600">Drag appointments to reschedule • Click to view details</p>
        </div>
      </div>
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex space-x-2">
          {['day', 'week', 'month'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={'px-4 py-2 rounded-lg font-semibold transition-all ' + (
                view === v
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-slate-700 border border-slate-300 hover:border-blue-400'
              )}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span className="text-slate-700 font-medium">Emergency</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
            <span className="text-slate-700 font-medium">High Priority</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span className="text-slate-700 font-medium">Normal</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 border-2 border-dashed border-yellow-500 rounded mr-2"></div>
            <span className="text-slate-700 font-medium">⚠️ Has Conflict</span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 calendar-container">
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700 }}
          view={view}
          onView={setView}
          onSelectEvent={handleSelectEvent}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventDrop}
          eventPropGetter={eventStyleGetter}
          resizable
          min={setHours(new Date(), 8)}
          max={setHours(new Date(), 18)}
          defaultDate={new Date()}
          popup
        />
      </div>
      {showModal && selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowModal(false);
            setSelectedAppointment(null);
          }}
          onSave={handleSaveAppointment}
          onDelete={handleDeleteAppointment}
        />
      )}
      <style jsx global>{`
        .calendar-container .rbc-header {
          padding: 12px 4px;
          font-weight: 600;
          color: #1e293b;
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
        }
        .calendar-container .rbc-today {
          background-color: #eff6ff;
        }
        .calendar-container .rbc-off-range-bg {
          background-color: #f8fafc;
        }
        .calendar-container .rbc-current-time-indicator {
          background-color: #3b82f6;
          height: 2px;
        }
        .calendar-container .rbc-event {
          cursor: pointer;
        }
        .calendar-container .rbc-event:hover {
          opacity: 0.9;
        }
        .calendar-container .rbc-time-slot:nth-child(-n+16),
        .calendar-container .rbc-time-slot:nth-child(n+37) {
          background-color: #f1f5f9;
        }
        @media (max-width: 768px) {
          .calendar-container .rbc-calendar {
            font-size: 12px;
          }
          .calendar-container .rbc-toolbar {
            flex-direction: column;
            gap: 12px;
          }
          .calendar-container .rbc-event {
            font-size: 11px;
            padding: 2px 4px;
          }
        }
      `}</style>
    </Layout>
  );
}
