import { useState, useEffect } from 'react';
import { X, Phone, MapPin, Clock, Tag, AlertCircle, Calendar, MessageSquare, Edit2, Save, Plus } from 'lucide-react';
import LeadConversationViewer from './LeadConversationViewer';
import { BACKEND_URL } from '../../lib/config';

const AVAILABLE_TAGS = [
  'emergency',
  'return_customer',
  'warranty',
  'after_hours',
  'high_priority'
];

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { value: 'collecting_info', label: 'Collecting Info', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'qualified', label: 'Qualified', color: 'bg-purple-100 text-purple-800' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-green-100 text-green-800' },
  { value: 'closed_won', label: 'Closed Won', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'closed_lost', label: 'Closed Lost', color: 'bg-gray-100 text-gray-800' }
];

const URGENCY_COLORS = {
  emergency: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  normal: 'bg-blue-100 text-blue-800 border-blue-300',
  low: 'bg-gray-100 text-gray-800 border-gray-300'
};

export default function LeadDetailModal({ leadId, isOpen, onClose, onUpdate }) {
  const [lead, setLead] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState({});
  const [editValues, setEditValues] = useState({});
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (isOpen && leadId) {
      fetchLeadDetails();
    }
  }, [isOpen, leadId]);

  const fetchLeadDetails = async () => {
    setLoading(true);
    try {
      // Fetch lead and timeline in parallel
      const [leadRes, timelineRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/leads?limit=1000`),
        fetch(`${BACKEND_URL}/api/leads/${leadId}/timeline`)
      ]);

      const leadData = await leadRes.json();
      const timelineData = await timelineRes.json();

      // Find the specific lead
      const foundLead = leadData.leads?.find(l => l.id === leadId);
      
      setLead(foundLead || null);
      setTimeline(timelineData.timeline || []);
      setEditValues({
        phone: foundLead?.phone || '',
        issue_summary: foundLead?.issue_summary || '',
        zip_code: foundLead?.zip_code || '',
        preferred_time: foundLead?.preferred_time || '',
        internal_notes: foundLead?.internal_notes || ''
      });
    } catch (error) {
      console.error('Error fetching lead details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/leads/${leadId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, createdBy: 'user' })
      });

      if (response.ok) {
        await fetchLeadDetails();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleFieldEdit = (field) => {
    setEditMode({ ...editMode, [field]: true });
  };

  const handleFieldSave = async (field) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          updates: { [field]: editValues[field] },
          createdBy: 'user'
        })
      });

      if (response.ok) {
        setEditMode({ ...editMode, [field]: false });
        await fetchLeadDetails();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setAddingNote(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote, createdBy: 'user' })
      });

      if (response.ok) {
        setNewNote('');
        await fetchLeadDetails();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setAddingNote(false);
    }
  };

  const handleAddTag = async (tag) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/leads/${leadId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag, createdBy: 'user' })
      });

      if (response.ok) {
        await fetchLeadDetails();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const handleRemoveTag = async (tag) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/leads/${leadId}/tags/${tag}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createdBy: 'user' })
      });

      if (response.ok) {
        await fetchLeadDetails();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'created': return <Plus className="w-4 h-4" />;
      case 'status_updated': return <AlertCircle className="w-4 h-4" />;
      case 'tag_added':
      case 'tag_removed': return <Tag className="w-4 h-4" />;
      case 'note_added': return <MessageSquare className="w-4 h-4" />;
      case 'field_updated': return <Edit2 className="w-4 h-4" />;
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Lead Details</h2>
            <p className="text-sm text-gray-500 mt-1">ID: {leadId?.substring(0, 8)}...</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading lead details...</p>
            </div>
          </div>
        ) : !lead ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <p className="text-gray-500">Lead not found</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Status Bar */}
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusChange(option.value)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        lead.status === option.value
                          ? option.color + ' ring-2 ring-offset-2 ring-blue-500'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">Phone</label>
                      {editMode.phone ? (
                        <div className="flex gap-2 mt-1">
                          <input
                            type="text"
                            value={editValues.phone}
                            onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <button
                            onClick={() => handleFieldSave('phone')}
                            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-gray-900">{lead.phone || 'Not provided'}</p>
                          <button
                            onClick={() => handleFieldEdit('phone')}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Edit2 className="w-3 h-3 text-gray-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">ZIP Code</label>
                      {editMode.zip_code ? (
                        <div className="flex gap-2 mt-1">
                          <input
                            type="text"
                            value={editValues.zip_code}
                            onChange={(e) => setEditValues({ ...editValues, zip_code: e.target.value })}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <button
                            onClick={() => handleFieldSave('zip_code')}
                            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-gray-900">{lead.zip_code || 'Not provided'}</p>
                          <button
                            onClick={() => handleFieldEdit('zip_code')}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Edit2 className="w-3 h-3 text-gray-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 md:col-span-2">
                    <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">Issue Summary</label>
                      {editMode.issue_summary ? (
                        <div className="flex gap-2 mt-1">
                          <textarea
                            value={editValues.issue_summary}
                            onChange={(e) => setEditValues({ ...editValues, issue_summary: e.target.value })}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            rows={2}
                          />
                          <button
                            onClick={() => handleFieldSave('issue_summary')}
                            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 h-fit"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 mt-1">
                          <p className="text-gray-900 flex-1">{lead.issue_summary || 'Not provided'}</p>
                          <button
                            onClick={() => handleFieldEdit('issue_summary')}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Edit2 className="w-3 h-3 text-gray-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {(lead.tags || []).map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-2"
                    >
                      {tag.replace(/_/g, ' ')}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {AVAILABLE_TAGS.filter(tag => !(lead.tags || []).includes(tag)).map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      + {tag.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgency */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Urgency</h3>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${URGENCY_COLORS[lead.urgency] || URGENCY_COLORS.normal}`}>
                  {lead.urgency?.toUpperCase() || 'NORMAL'}
                </span>
              </div>

              {/* Add Note */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Add Note</h3>
                <div className="flex gap-2">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note about this lead..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || addingNote}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors h-fit"
                  >
                    {addingNote ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Conversation & Timeline</h3>
                <LeadConversationViewer leadId={leadId} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
