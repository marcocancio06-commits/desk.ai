// In-memory lead storage
// TODO: Replace with database (MongoDB, PostgreSQL, etc.) in production

let leads = [];

// Generate a unique ID for new leads
function generateLeadId() {
  return `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Map AI booking intent to lead status
function mapIntentToStatus(bookingIntent) {
  const mapping = {
    'none': 'new',
    'collecting_info': 'collecting_info',
    'ready_to_book': 'qualified'
  };
  return mapping[bookingIntent] || 'new';
}

// Create or update a lead from a message conversation
function upsertLeadFromMessage({ businessId, channel, from, message, aiResult }) {
  const now = new Date().toISOString();
  
  // Find existing lead by businessId and phone number
  let lead = leads.find(l => l.businessId === businessId && l.phone === from);
  
  if (lead) {
    // Update existing lead
    lead.lastMessage = message;
    lead.updatedAt = now;
    
    // Update collected data from AI result
    if (aiResult.collected_data) {
      if (aiResult.collected_data.issue_summary) {
        lead.issueSummary = aiResult.collected_data.issue_summary;
      }
      if (aiResult.collected_data.zip_code) {
        lead.zipCode = aiResult.collected_data.zip_code;
      }
      if (aiResult.collected_data.preferred_time) {
        lead.preferredTime = aiResult.collected_data.preferred_time;
      }
      if (aiResult.collected_data.urgency) {
        lead.urgency = aiResult.collected_data.urgency;
      }
    }
    
    // Update status based on booking intent
    lead.status = mapIntentToStatus(aiResult.booking_intent);
    
    // Append messages to conversation history
    lead.messages.push({
      from: 'customer',
      text: message,
      timestamp: now
    });
    
    lead.messages.push({
      from: 'assistant',
      text: aiResult.reply,
      timestamp: now
    });
    
  } else {
    // Create new lead
    lead = {
      id: generateLeadId(),
      businessId: businessId,
      source: channel || 'web_chat',
      customerName: null, // Could be extracted from conversation later
      phone: from,
      lastMessage: message,
      issueSummary: aiResult.collected_data?.issue_summary || null,
      zipCode: aiResult.collected_data?.zip_code || null,
      preferredTime: aiResult.collected_data?.preferred_time || null,
      urgency: aiResult.collected_data?.urgency || null,
      status: mapIntentToStatus(aiResult.booking_intent),
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          from: 'customer',
          text: message,
          timestamp: now
        },
        {
          from: 'assistant',
          text: aiResult.reply,
          timestamp: now
        }
      ]
    };
    
    leads.push(lead);
  }
  
  return lead;
}

// Get all leads for a specific business
function getLeadsForBusiness(businessId) {
  return leads
    .filter(lead => lead.businessId === businessId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

// Get a single lead by ID
function getLeadById(leadId) {
  return leads.find(lead => lead.id === leadId);
}

// Get lead statistics for a business
function getLeadStats(businessId) {
  const businessLeads = leads.filter(lead => lead.businessId === businessId);
  
  return {
    total: businessLeads.length,
    new: businessLeads.filter(l => l.status === 'new').length,
    collecting_info: businessLeads.filter(l => l.status === 'collecting_info').length,
    qualified: businessLeads.filter(l => l.status === 'qualified').length,
    scheduled: businessLeads.filter(l => l.status === 'scheduled').length,
    closed_won: businessLeads.filter(l => l.status === 'closed_won').length,
    closed_lost: businessLeads.filter(l => l.status === 'closed_lost').length,
  };
}

module.exports = {
  upsertLeadFromMessage,
  getLeadsForBusiness,
  getLeadById,
  getLeadStats
};
