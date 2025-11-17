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
      scheduledTime: null, // Business owner can set this later
      ownerNotes: null, // Business owner's notes
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

// Helper to check if a date is today (same calendar day)
function isToday(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate();
}

// Helper to check if a date is within last N days
function isWithinLastNDays(dateString, days) {
  const date = new Date(dateString);
  const now = new Date();
  const nDaysAgo = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  
  return date >= nDaysAgo;
}

// Get metrics for today and last 7 days
function getMetricsForPeriods(businessId) {
  const businessLeads = leads.filter(lead => lead.businessId === businessId);
  
  // Today's leads
  const todayLeads = businessLeads.filter(l => isToday(l.createdAt));
  
  // Last 7 days leads
  const last7DaysLeads = businessLeads.filter(l => isWithinLastNDays(l.createdAt, 7));
  
  // Helper to count by status
  const countByStatus = (leadsArray) => ({
    totalLeads: leadsArray.length,
    new: leadsArray.filter(l => l.status === 'new').length,
    collecting_info: leadsArray.filter(l => l.status === 'collecting_info').length,
    qualified: leadsArray.filter(l => l.status === 'qualified').length,
    scheduled: leadsArray.filter(l => l.status === 'scheduled').length,
    urgent: leadsArray.filter(l => l.urgency === 'high' || l.urgency === 'emergency').length
  });
  
  return {
    today: countByStatus(todayLeads),
    last7Days: countByStatus(last7DaysLeads)
  };
}

// Get appointments (qualified or scheduled leads)
function getAppointments(businessId) {
  const businessLeads = leads.filter(lead => lead.businessId === businessId);
  
  // Filter for qualified or scheduled leads
  const appointmentLeads = businessLeads.filter(l => 
    l.status === 'qualified' || l.status === 'scheduled'
  );
  
  // Map to appointment format
  return appointmentLeads.map(lead => ({
    id: `apt-${lead.id}`,
    leadId: lead.id,
    customerName: lead.customerName,
    phone: lead.phone,
    issueSummary: lead.issueSummary,
    scheduledTime: lead.preferredTime, // Could be null
    status: lead.status,
    urgency: lead.urgency
  }));
}

// Update specific fields of a lead
// TODO: Add authentication to verify business owner can update this lead
function updateLeadFields({ leadId, businessId, status, urgency, scheduledTime, ownerNotes }) {
  // Find the lead by ID and verify it belongs to this business
  const lead = leads.find(l => l.id === leadId && l.businessId === businessId);
  
  if (!lead) {
    return null; // Lead not found or doesn't belong to this business
  }
  
  // Define valid values for validation
  const validStatuses = ['new', 'collecting_info', 'qualified', 'quoted', 'scheduled', 'closed_won', 'closed_lost'];
  const validUrgencies = ['low', 'normal', 'high', 'emergency'];
  
  // Update only provided fields
  if (status !== undefined) {
    // Validate status before updating
    if (validStatuses.includes(status)) {
      lead.status = status;
    }
    // If invalid, keep existing status (don't crash)
  }
  
  if (urgency !== undefined) {
    // Validate urgency before updating
    if (validUrgencies.includes(urgency)) {
      lead.urgency = urgency;
    }
    // If invalid, keep existing urgency (don't crash)
  }
  
  if (scheduledTime !== undefined) {
    // Allow null to clear the scheduled time
    lead.scheduledTime = scheduledTime;
  }
  
  if (ownerNotes !== undefined) {
    // Allow empty string or null
    lead.ownerNotes = ownerNotes;
  }
  
  // Update the timestamp
  lead.updatedAt = new Date().toISOString();
  
  return lead;
}

module.exports = {
  upsertLeadFromMessage,
  getLeadsForBusiness,
  getLeadById,
  getLeadStats,
  getMetricsForPeriods,
  getAppointments,
  updateLeadFields
};
