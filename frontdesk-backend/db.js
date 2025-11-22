const { supabase } = require('./supabaseClient');

// ============================================================================
// DATABASE LAYER - All CRUD operations for Desk.ai
// ============================================================================

// ============================================================================
// BUSINESS SETTINGS
// ============================================================================

async function getBusinessSettings(businessId) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('business_settings')
    .select('*')
    .eq('business_id', businessId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    throw error;
  }

  return data;
}

async function upsertBusinessSettings(businessId, settings) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('business_settings')
    .upsert({
      business_id: businessId,
      ...settings
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// LEADS
// ============================================================================

async function createLead({ businessId, phone, channel = 'sms' }) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      business_id: businessId,
      phone,
      channel,
      status: 'new',
      conversation_state: 'initial'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getLeadByPhone(businessId, phone) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('business_id', businessId)
    .eq('phone', phone)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

async function getLeadById(leadId) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error) throw error;
  return data;
}

async function updateLead(leadId, updates) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', leadId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getAllLeads(businessId, filters = {}) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  let query = supabase
    .from('leads')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.urgency) {
    query = query.eq('urgency', filters.urgency);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

async function getLeadStats(businessId, daysAgo = 0) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);
  
  const { data, error } = await supabase
    .from('leads')
    .select('status, urgency, conversation_state')
    .eq('business_id', businessId)
    .gte('created_at', startDate.toISOString());

  if (error) throw error;

  // Aggregate stats
  const stats = {
    totalLeads: data.length,
    new: 0,
    collecting_info: 0,
    qualified: 0,
    scheduled: 0,
    urgent: 0
  };

  data.forEach(lead => {
    if (lead.status === 'new') stats.new++;
    if (lead.conversation_state === 'collecting_info') stats.collecting_info++;
    if (lead.conversation_state === 'qualified') stats.qualified++;
    if (lead.status === 'scheduled') stats.scheduled++;
    if (lead.urgency === 'emergency' || lead.urgency === 'high') stats.urgent++;
  });

  return stats;
}

// ============================================================================
// MESSAGES
// ============================================================================

async function createMessage({ leadId, sender, text, aiData = null, channel = 'sms' }) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      lead_id: leadId,
      sender,
      text,
      ai_data: aiData,
      channel
    })
    .select()
    .single();

  if (error) throw error;

  // Update lead's last_message_at
  await supabase
    .from('leads')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', leadId);

  return data;
}

async function getMessagesByLead(leadId, limit = 50) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

async function getConversationHistory(leadId) {
  const messages = await getMessagesByLead(leadId);
  
  return messages.map(msg => ({
    role: msg.sender === 'customer' ? 'user' : 'assistant',
    content: msg.text,
    timestamp: msg.created_at
  }));
}

// ============================================================================
// APPOINTMENTS
// ============================================================================

async function createAppointment({ leadId, businessId, scheduledDate, scheduledTime, issueSummary, zipCode, urgency, customerPhone, notes = '' }) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      lead_id: leadId,
      business_id: businessId,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      issue_summary: issueSummary,
      zip_code: zipCode,
      urgency,
      customer_phone: customerPhone,
      notes,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;

  // Update lead status to scheduled
  await updateLead(leadId, { status: 'scheduled' });

  return data;
}

async function getAppointmentsByBusiness(businessId, filters = {}) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  let query = supabase
    .from('appointments')
    .select('*')
    .eq('business_id', businessId)
    .order('scheduled_date', { ascending: true });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.startDate) {
    query = query.gte('scheduled_date', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('scheduled_date', filters.endDate);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

async function updateAppointment(appointmentId, updates) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteAppointment(appointmentId) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId);

  if (error) throw error;
  return true;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getOrCreateLead(businessId, phone, channel = 'sms') {
  let lead = await getLeadByPhone(businessId, phone);
  
  if (!lead) {
    lead = await createLead({ businessId, phone, channel });
  }
  
  return lead;
}

async function updateLeadFromAIResponse(leadId, aiResponse) {
  const updates = {
    conversation_state: aiResponse.booking_intent || 'collecting_info',
    internal_notes: aiResponse.internal_notes
  };

  // Update collected data
  if (aiResponse.collected_data) {
    const { issue_summary, zip_code, preferred_time, urgency } = aiResponse.collected_data;
    
    if (issue_summary) updates.issue_summary = issue_summary;
    if (zip_code) updates.zip_code = zip_code;
    if (preferred_time) updates.preferred_time = preferred_time;
    if (urgency) updates.urgency = urgency;
  }

  // Update confidence scores
  if (aiResponse.confidence_scores) {
    updates.confidence_scores = aiResponse.confidence_scores;
  }

  // Update status based on conversation state
  if (aiResponse.booking_intent === 'ready_to_book') {
    updates.status = 'ready_to_book';
  }

  return await updateLead(leadId, updates);
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Business Settings
  getBusinessSettings,
  upsertBusinessSettings,
  
  // Leads
  createLead,
  getLeadByPhone,
  getLeadById,
  updateLead,
  getAllLeads,
  getLeadStats,
  getOrCreateLead,
  updateLeadFromAIResponse,
  
  // Messages
  createMessage,
  getMessagesByLead,
  getConversationHistory,
  
  // Appointments
  createAppointment,
  getAppointmentsByBusiness,
  updateAppointment,
  deleteAppointment
};
