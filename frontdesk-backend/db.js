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

// Helper function declarations first
let createLeadEvent; // Forward declaration

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
      conversation_state: 'initial',
      tags: []
    })
    .select()
    .single();

  if (error) throw error;

  // Create "created" event (only if createLeadEvent is available)
  if (createLeadEvent) {
    try {
      await createLeadEvent({
        leadId: data.id,
        eventType: 'created',
        eventData: { phone, channel },
        description: `Lead created from ${channel}`,
        createdBy: 'system'
      });
    } catch (err) {
      console.error('Failed to create lead event:', err);
    }
  }

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
// SMS MESSAGES (Twilio)
// ============================================================================

async function createSMSMessage({ 
  leadId, 
  twilioSid, 
  twilioAccountSid,
  direction, 
  fromNumber, 
  toNumber, 
  body, 
  status = 'sent',
  numMedia = 0,
  fromCity = null,
  fromState = null,
  fromZip = null,
  fromCountry = null,
  errorCode = null,
  errorMessage = null
}) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      lead_id: leadId,
      twilio_sid: twilioSid,
      twilio_account_sid: twilioAccountSid,
      direction,
      from_number: fromNumber,
      to_number: toNumber,
      body,
      status,
      num_media: numMedia,
      from_city: fromCity,
      from_state: fromState,
      from_zip: fromZip,
      from_country: fromCountry,
      error_code: errorCode,
      error_message: errorMessage,
      sent_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    // Check if it's a duplicate message (Twilio sometimes sends webhooks twice)
    if (error.code === '23505') { // unique_violation
      console.log(`ℹ️  Duplicate SMS message ignored: ${twilioSid}`);
      return null;
    }
    throw error;
  }

  // Update lead's SMS tracking fields
  await supabase
    .from('leads')
    .update({ 
      sms_enabled: true,
      last_sms_at: new Date().toISOString() 
    })
    .eq('id', leadId);

  return data;
}

async function getSMSMessagesByLead(leadId, limit = 50) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('lead_id', leadId)
    .order('sent_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

async function getSMSMessageByTwilioSid(twilioSid) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('twilio_sid', twilioSid)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

async function updateSMSMessageStatus(twilioSid, status, errorCode = null, errorMessage = null) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const updateData = { status };
  if (errorCode) updateData.error_code = errorCode;
  if (errorMessage) updateData.error_message = errorMessage;
  if (status === 'delivered') updateData.delivered_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('messages')
    .update(updateData)
    .eq('twilio_sid', twilioSid)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getLeadsWithSMS(limit = 100) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('sms_enabled', true)
    .order('last_sms_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
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
    .select(`
      *,
      leads (
        phone,
        issue_summary,
        zip_code,
        urgency
      )
    `)
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
  
  // Flatten the joined lead data into the appointment object
  const flattenedData = (data || []).map(apt => {
    const lead = apt.leads;
    delete apt.leads;
    return {
      ...apt,
      customer_phone: lead?.phone,
      issue_summary: lead?.issue_summary,
      zip_code: lead?.zip_code,
      urgency: lead?.urgency
    };
  });
  
  return flattenedData;
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
// LEAD EVENTS (Timeline)
// ============================================================================

createLeadEvent = async function({ leadId, eventType, eventData = {}, description, createdBy = 'system' }) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('lead_events')
    .insert({
      lead_id: leadId,
      event_type: eventType,
      event_data: eventData,
      description,
      created_by: createdBy
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

async function getLeadEvents(leadId, limit = 100) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('lead_events')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

async function getLeadTimeline(leadId) {
  // Get both events and messages for a complete timeline
  const [events, messages] = await Promise.all([
    getLeadEvents(leadId),
    getMessagesByLead(leadId)
  ]);

  // Combine and sort by timestamp
  const timeline = [
    ...events.map(e => ({ ...e, type: 'event' })),
    ...messages.map(m => ({ ...m, type: 'message' }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return timeline;
}

// ============================================================================
// LEAD TAGS
// ============================================================================

async function addLeadTag(leadId, tag, createdBy = 'user') {
  const lead = await getLeadById(leadId);
  if (!lead) throw new Error('Lead not found');

  const tags = lead.tags || [];
  if (tags.includes(tag)) {
    return lead; // Tag already exists
  }

  const updatedTags = [...tags, tag];
  const updatedLead = await updateLead(leadId, { tags: updatedTags });

  // Create event
  await createLeadEvent({
    leadId,
    eventType: 'tag_added',
    eventData: { tag },
    description: `Tag "${tag}" added`,
    createdBy
  });

  return updatedLead;
}

async function removeLeadTag(leadId, tag, createdBy = 'user') {
  const lead = await getLeadById(leadId);
  if (!lead) throw new Error('Lead not found');

  const tags = lead.tags || [];
  const updatedTags = tags.filter(t => t !== tag);
  const updatedLead = await updateLead(leadId, { tags: updatedTags });

  // Create event
  await createLeadEvent({
    leadId,
    eventType: 'tag_removed',
    eventData: { tag },
    description: `Tag "${tag}" removed`,
    createdBy
  });

  return updatedLead;
}

// ============================================================================
// ENHANCED LEAD UPDATES WITH EVENTS
// ============================================================================

async function updateLeadWithEvent(leadId, updates, createdBy = 'user') {
  const oldLead = await getLeadById(leadId);
  if (!oldLead) throw new Error('Lead not found');

  const updatedLead = await updateLead(leadId, updates);

  // Create events for each changed field
  for (const [field, newValue] of Object.entries(updates)) {
    const oldValue = oldLead[field];
    if (oldValue !== newValue && field !== 'updated_at') {
      await createLeadEvent({
        leadId,
        eventType: 'field_updated',
        eventData: { field, old_value: oldValue, new_value: newValue },
        description: `${field.replace(/_/g, ' ')} changed from "${oldValue || 'empty'}" to "${newValue}"`,
        createdBy
      });
    }
  }

  return updatedLead;
}

async function updateLeadStatus(leadId, newStatus, createdBy = 'user') {
  const oldLead = await getLeadById(leadId);
  if (!oldLead) throw new Error('Lead not found');

  const updatedLead = await updateLead(leadId, { status: newStatus });

  await createLeadEvent({
    leadId,
    eventType: 'status_updated',
    eventData: { old_status: oldLead.status, new_status: newStatus },
    description: `Status changed from "${oldLead.status}" to "${newStatus}"`,
    createdBy
  });

  return updatedLead;
}

async function addLeadNote(leadId, note, createdBy = 'user') {
  const lead = await getLeadById(leadId);
  if (!lead) throw new Error('Lead not found');

  const currentNotes = lead.internal_notes || '';
  const timestamp = new Date().toISOString();
  const newNote = `\n[${timestamp}] ${note}`;
  const updatedNotes = currentNotes + newNote;

  const updatedLead = await updateLead(leadId, { internal_notes: updatedNotes });

  await createLeadEvent({
    leadId,
    eventType: 'note_added',
    eventData: { note },
    description: `Note added: "${note.substring(0, 50)}${note.length > 50 ? '...' : ''}"`,
    createdBy
  });

  return updatedLead;
}

// ============================================================================
// GOOGLE CALENDAR OAUTH
// ============================================================================

async function saveGoogleCalendarTokens(tokenData) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('google_calendar_tokens')
    .upsert({
      business_id: tokenData.businessId,
      access_token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken,
      token_type: tokenData.tokenType,
      expiry_date: tokenData.expiryDate,
      scope: tokenData.scope,
      calendar_id: tokenData.calendarId || 'primary',
      connected_email: tokenData.connectedEmail,
      is_active: true
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getGoogleCalendarTokens(businessId) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (!data) return null;

  return {
    businessId: data.business_id,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenType: data.token_type,
    expiryDate: data.expiry_date,
    scope: data.scope,
    calendarId: data.calendar_id,
    connectedEmail: data.connected_email,
    isActive: data.is_active,
    createdAt: data.created_at
  };
}

async function updateGoogleCalendarTokens(businessId, updates) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const updateData = {};
  if (updates.accessToken) updateData.access_token = updates.accessToken;
  if (updates.expiryDate) updateData.expiry_date = updates.expiryDate;

  const { data, error } = await supabase
    .from('google_calendar_tokens')
    .update(updateData)
    .eq('business_id', businessId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deactivateGoogleCalendarTokens(businessId) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('google_calendar_tokens')
    .update({ is_active: false })
    .eq('business_id', businessId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// GOOGLE CALENDAR EVENT MAPPING
// ============================================================================

async function createGoogleCalendarEventMapping(mapping) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('google_calendar_events')
    .insert({
      appointment_id: mapping.appointmentId,
      business_id: mapping.businessId,
      google_event_id: mapping.googleEventId,
      calendar_id: mapping.calendarId,
      sync_status: mapping.syncStatus || 'synced'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateGoogleCalendarEventMapping(appointmentId, updates) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const updateData = {};
  if (updates.syncStatus) updateData.sync_status = updates.syncStatus;
  if (updates.syncError) updateData.sync_error = updates.syncError;
  updateData.last_synced_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('google_calendar_events')
    .update(updateData)
    .eq('appointment_id', appointmentId)
    .select()
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

async function getGoogleCalendarEventMapping(appointmentId) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('google_calendar_events')
    .select('*')
    .eq('appointment_id', appointmentId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

// ============================================================================
// GOOGLE CALENDAR CONFLICTS
// ============================================================================

async function createGoogleCalendarConflict(conflict) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('google_calendar_conflicts')
    .insert({
      appointment_id: conflict.appointmentId,
      business_id: conflict.businessId,
      conflict_type: conflict.conflictType,
      google_event_id: conflict.googleEventId,
      google_event_summary: conflict.googleEventSummary,
      google_event_start: conflict.googleEventStart,
      google_event_end: conflict.googleEventEnd,
      conflict_severity: conflict.conflictSeverity || 'warning',
      is_resolved: false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getAppointmentConflicts(appointmentId) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('google_calendar_conflicts')
    .select('*')
    .eq('appointment_id', appointmentId)
    .eq('is_resolved', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function resolveConflict(conflictId, resolvedBy = 'user') {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('google_calendar_conflicts')
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy
    })
    .eq('id', conflictId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// GOOGLE CALENDAR SYNC
// ============================================================================

async function logGoogleCalendarSync(logData) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('google_calendar_sync_log')
    .insert({
      business_id: logData.businessId,
      sync_type: logData.syncType,
      sync_direction: logData.syncDirection,
      events_pushed: logData.eventsPushed || 0,
      events_pulled: logData.eventsPulled || 0,
      conflicts_detected: logData.conflictsDetected || 0,
      errors_count: logData.errorsCount || 0,
      sync_status: logData.syncStatus,
      error_message: logData.errorMessage,
      duration_ms: logData.durationMs
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getAppointmentsNeedingSync(businessId) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  // Get appointments that have been updated but not synced
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      leads (
        phone,
        issue_summary,
        zip_code,
        urgency,
        internal_notes
      )
    `)
    .eq('business_id', businessId)
    .in('status', ['pending', 'confirmed'])
    .not('scheduled_date', 'is', null)
    .or('last_synced_at.is.null,updated_at.gt.last_synced_at')
    .order('scheduled_date', { ascending: true });

  if (error) throw error;

  return (data || []).map(apt => ({
    id: apt.id,
    businessId: apt.business_id,
    scheduledStart: apt.scheduled_date && apt.scheduled_time 
      ? `${apt.scheduled_date}T${apt.scheduled_time}:00` 
      : null,
    scheduledEnd: null, // Can calculate based on duration
    issueSummary: apt.leads?.issue_summary,
    customerPhone: apt.leads?.phone,
    zipCode: apt.leads?.zip_code,
    urgency: apt.leads?.urgency,
    internalNotes: apt.leads?.internal_notes || apt.notes,
    status: apt.status,
    googleEventId: apt.google_event_id
  }));
}

async function getUpcomingAppointments(businessId) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      leads (
        phone,
        issue_summary,
        zip_code,
        urgency,
        internal_notes
      )
    `)
    .eq('business_id', businessId)
    .in('status', ['pending', 'confirmed'])
    .gte('scheduled_date', today)
    .order('scheduled_date', { ascending: true });

  if (error) throw error;

  return (data || []).map(apt => ({
    id: apt.id,
    businessId: apt.business_id,
    scheduledStart: apt.scheduled_date && apt.scheduled_time 
      ? `${apt.scheduled_date}T${apt.scheduled_time}:00` 
      : null,
    scheduledEnd: null,
    issueSummary: apt.leads?.issue_summary,
    customerPhone: apt.leads?.phone,
    zipCode: apt.leads?.zip_code,
    urgency: apt.leads?.urgency,
    internalNotes: apt.leads?.internal_notes || apt.notes,
    status: apt.status,
    googleEventId: apt.google_event_id,
    hasConflict: apt.has_conflict
  }));
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
  updateLeadWithEvent,
  updateLeadStatus,
  addLeadNote,
  
  // Messages
  createMessage,
  getMessagesByLead,
  getConversationHistory,
  
  // SMS Messages (Twilio)
  createSMSMessage,
  getSMSMessagesByLead,
  getSMSMessageByTwilioSid,
  updateSMSMessageStatus,
  getLeadsWithSMS,
  
  // Appointments
  createAppointment,
  getAppointmentsByBusiness,
  updateAppointment,
  deleteAppointment,

  // Lead Events (Timeline)
  createLeadEvent,
  getLeadEvents,
  getLeadTimeline,

  // Lead Tags
  addLeadTag,
  removeLeadTag,

  // Google Calendar OAuth
  saveGoogleCalendarTokens,
  getGoogleCalendarTokens,
  updateGoogleCalendarTokens,
  deactivateGoogleCalendarTokens,
  
  // Google Calendar Event Mapping
  createGoogleCalendarEventMapping,
  updateGoogleCalendarEventMapping,
  getGoogleCalendarEventMapping,
  
  // Google Calendar Conflicts
  createGoogleCalendarConflict,
  getAppointmentConflicts,
  resolveConflict,
  
  // Google Calendar Sync
  logGoogleCalendarSync,
  getAppointmentsNeedingSync,
  getUpcomingAppointments
};
