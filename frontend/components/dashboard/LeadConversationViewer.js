import { useState, useEffect } from 'react';
import { MessageSquare, User, Bot, Phone, MapPin, Clock, AlertCircle, Calendar } from 'lucide-react';

export default function LeadConversationViewer({ leadId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [extractedInfo, setExtractedInfo] = useState(null);

  useEffect(() => {
    if (leadId) {
      fetchConversation();
    }
  }, [leadId]);

  const fetchConversation = async () => {
    setLoading(true);
    try {
      // Fetch conversation messages and lead details
      const [timelineRes, leadRes] = await Promise.all([
        fetch(`http://localhost:3001/api/leads/${leadId}/timeline`),
        fetch(`http://localhost:3001/api/leads?limit=1000`)
      ]);

      const timelineData = await timelineRes.json();
      const leadData = await leadRes.json();

      // Find the specific lead
      const lead = leadData.leads?.find(l => l.id === leadId);

      // Filter for message items only
      const messageItems = (timelineData.timeline || []).filter(item => item.type === 'message');
      setMessages(messageItems);

      // Extract relevant info from lead
      if (lead) {
        setExtractedInfo({
          issue: lead.issue_summary,
          phone: lead.phone,
          zipCode: lead.zip_code,
          urgency: lead.urgency,
          preferredTime: lead.preferred_time,
          status: lead.status
        });
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <MessageSquare className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
        <p className="text-gray-500">This lead hasn't had any conversation yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Extracted Information Highlights */}
      {extractedInfo && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-blue-600" />
            Key Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Issue */}
            {extractedInfo.issue && (
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-500 mb-1">Issue</div>
                    <div className="text-sm text-gray-900 line-clamp-2">{extractedInfo.issue}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Phone */}
            {extractedInfo.phone && (
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-500 mb-1">Contact</div>
                    <div className="text-sm text-gray-900 font-medium">{extractedInfo.phone}</div>
                  </div>
                </div>
              </div>
            )}

            {/* ZIP Code */}
            {extractedInfo.zipCode && (
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-500 mb-1">ZIP Code</div>
                    <div className="text-sm text-gray-900 font-medium">{extractedInfo.zipCode}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Urgency */}
            {extractedInfo.urgency && (
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-500 mb-1">Urgency</div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(extractedInfo.urgency)}`}>
                      {extractedInfo.urgency.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline-Style Transcript */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center">
            <MessageSquare className="w-4 h-4 mr-2" />
            Conversation Transcript
          </h3>
        </div>
        
        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {messages.map((msg, index) => {
            const isCustomer = msg.sender === 'customer';
            const isAI = msg.sender === 'assistant' || msg.sender === 'ai';

            return (
              <div key={index} className={`flex gap-3 ${isCustomer ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                  isCustomer 
                    ? 'bg-gray-300' 
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                }`}>
                  {isCustomer ? (
                    <User className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`flex-1 max-w-[70%] ${isCustomer ? 'text-right' : ''}`}>
                  <div className={`inline-block text-left ${
                    isCustomer 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl rounded-br-sm' 
                      : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm'
                  } px-4 py-3 shadow-sm`}>
                    {/* Sender Label */}
                    <div className={`text-xs font-medium mb-1 ${
                      isCustomer ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {isCustomer ? 'Customer' : 'AI Assistant'}
                    </div>
                    
                    {/* Message Text */}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </div>
                  </div>
                  
                  {/* Timestamp */}
                  <div className={`text-xs text-gray-500 mt-1 ${isCustomer ? 'text-right' : 'text-left'}`}>
                    {formatTimestamp(msg.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
