const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();
const { handleCustomerMessage, generateDailySummary } = require('./aiClient');
const { supabase } = require('./supabaseClient');
const db = require('./db');
const { 
  createAppointmentEvent, 
  updateAppointmentEvent,
  isEnabled: isCalendarEnabled 
} = require('./calendarClient');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    database: supabase ? 'connected' : 'not configured',
    timestamp: new Date().toISOString()
  });
});

// Message handling endpoint - Now with database persistence
app.post('/api/message', async (req, res) => {
  const { businessId, from, channel, message } = req.body;
  
  if (!message) {
    return res.status(400).json({ 
      error: 'Message is required' 
    });
  }
  
  try {
    const targetBusinessId = businessId || 'demo-business-001';
    const targetFrom = from || 'unknown';
    
    // Get or create lead
    const lead = await db.getOrCreateLead(targetBusinessId, targetFrom, channel || 'web');
    
    // Save customer message
    await db.createMessage({
      leadId: lead.id,
      sender: 'customer',
      text: message,
      channel: channel || 'web'
    });
    
    // Get conversation history for context
    const conversationHistory = await db.getConversationHistory(lead.id);
    
    // Build conversation state from lead
    const conversationState = {
      collected_data: {
        issue_summary: lead.issue_summary,
        zip_code: lead.zip_code,
        preferred_time: lead.preferred_time,
        urgency: lead.urgency
      },
      confidence_scores: lead.confidence_scores || {},
      state: lead.conversation_state
    };
    
    // Call AI with conversation state
    const aiResult = await handleCustomerMessage({
      businessId: targetBusinessId,
      from: targetFrom,
      channel: channel || 'web',
      message,
      conversationState
    });
    
    // Save AI response message
    await db.createMessage({
      leadId: lead.id,
      sender: 'ai',
      text: aiResult.reply,
      aiData: aiResult,
      channel: channel || 'web'
    });
    
    // Update lead with AI-extracted data
    const updatedLead = await db.updateLeadFromAIResponse(lead.id, aiResult);
    
    // Return AI result with lead summary
    res.status(200).json({
      ...aiResult,
      lead: {
        id: updatedLead.id,
        status: updatedLead.status,
        conversation_state: updatedLead.conversation_state,
        updatedAt: updatedLead.updated_at
      }
    });
  } catch (error) {
    console.error('Error handling message:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      details: error.message
    });
  }
});

// Get leads for a business - Now from database
app.get('/api/leads', async (req, res) => {
  let { businessId, status, urgency, limit } = req.query;
  
  // Default to demo business if not provided (for demo/development mode)
  if (!businessId) {
    console.warn('⚠️  No businessId provided to /api/leads, defaulting to demo-business-001');
    businessId = 'demo-business-001';
  }
  
  try {
    const filters = {};
    if (status) filters.status = status;
    if (urgency) filters.urgency = urgency;
    if (limit) filters.limit = parseInt(limit);
    
    const leads = await db.getAllLeads(businessId, filters);
    const statsToday = await db.getLeadStats(businessId, 0);
    const statsLast7Days = await db.getLeadStats(businessId, 7);
    
    res.status(200).json({ 
      leads,
      stats: {
        today: statsToday,
        last7Days: statsLast7Days
      },
      count: leads.length
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leads',
      details: error.message
    });
  }
});

// Get daily summary with metrics and AI-generated insights - Now from database
app.get('/api/summary', async (req, res) => {
  const { businessId } = req.query;
  
  // Default to demo-business-001 if not provided
  const targetBusinessId = businessId || 'demo-business-001';
  
  try {
    // Get metrics for today and last 7 days from database
    const metricsToday = await db.getLeadStats(targetBusinessId, 0);
    const metricsLast7Days = await db.getLeadStats(targetBusinessId, 7);
    
    const metrics = {
      today: metricsToday,
      last7Days: metricsLast7Days
    };
    
    // Get ready-to-book appointments from database
    const allAppointments = await db.getAppointmentsByBusiness(targetBusinessId, {
      status: 'pending'
    });
    
    // Also get qualified leads that could be scheduled
    const qualifiedLeads = await db.getAllLeads(targetBusinessId, {
      status: 'ready_to_book',
      limit: 10
    });
    
    const appointments = [
      ...allAppointments.map(apt => ({
        issueSummary: apt.issue_summary,
        urgency: apt.urgency,
        scheduledTime: apt.scheduled_time,
        zipCode: apt.zip_code
      })),
      ...qualifiedLeads.map(lead => ({
        issueSummary: lead.issue_summary,
        urgency: lead.urgency,
        scheduledTime: lead.preferred_time,
        zipCode: lead.zip_code
      }))
    ];
    
    // Generate AI summary
    const aiSummary = await generateDailySummary({
      businessId: targetBusinessId,
      metrics,
      appointments
    });
    
    // Calculate date range
    const today = new Date();
    const last7DaysStart = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    // Return complete summary
    res.status(200).json({
      businessId: targetBusinessId,
      dateRange: {
        today: today.toISOString().split('T')[0],
        last7DaysStart: last7DaysStart.toISOString().split('T')[0]
      },
      metrics,
      appointments,
      aiSummary
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ 
      error: 'Failed to generate summary',
      details: error.message
    });
  }
});

// Update a lead's fields - Now using database
app.patch('/api/leads/:id', async (req, res) => {
  const { id } = req.params;
  const { businessId, status, urgency, scheduledTime, ownerNotes } = req.body;
  
  // Validate required fields
  if (!businessId) {
    return res.status(400).json({ 
      error: 'businessId is required in request body' 
    });
  }
  
  if (!id) {
    return res.status(400).json({ 
      error: 'Lead ID is required in URL path' 
    });
  }
  
  try {
    // Build updates object
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (urgency !== undefined) updates.urgency = urgency;
    if (scheduledTime !== undefined) updates.preferred_time = scheduledTime;
    if (ownerNotes !== undefined) updates.internal_notes = ownerNotes;
    
    // Update the lead
    const updatedLead = await db.updateLead(id, updates);
    
    // Verify it belongs to the business
    if (updatedLead.business_id !== businessId) {
      return res.status(403).json({
        error: 'Lead does not belong to this business'
      });
    }
    
    // Return the updated lead
    res.status(200).json({ 
      lead: updatedLead,
      message: 'Lead updated successfully'
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ 
        error: 'Lead not found'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to update lead',
      details: error.message
    });
  }
});

// Get lead timeline (events + messages)
app.get('/api/leads/:id/timeline', async (req, res) => {
  const { id } = req.params;
  
  try {
    const timeline = await db.getLeadTimeline(id);
    res.status(200).json({ timeline });
  } catch (error) {
    console.error('Error fetching lead timeline:', error);
    res.status(500).json({ 
      error: 'Failed to fetch lead timeline',
      details: error.message
    });
  }
});

// Get lead events only
app.get('/api/leads/:id/events', async (req, res) => {
  const { id } = req.params;
  
  try {
    const events = await db.getLeadEvents(id);
    res.status(200).json({ events });
  } catch (error) {
    console.error('Error fetching lead events:', error);
    res.status(500).json({ 
      error: 'Failed to fetch lead events',
      details: error.message
    });
  }
});

// Update lead status with event tracking
app.post('/api/leads/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, createdBy = 'user' } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  
  try {
    const updatedLead = await db.updateLeadStatus(id, status, createdBy);
    res.status(200).json({ 
      lead: updatedLead,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('Error updating lead status:', error);
    res.status(500).json({ 
      error: 'Failed to update lead status',
      details: error.message
    });
  }
});

// Add note to lead
app.post('/api/leads/:id/notes', async (req, res) => {
  const { id } = req.params;
  const { note, createdBy = 'user' } = req.body;
  
  if (!note || !note.trim()) {
    return res.status(400).json({ error: 'Note is required' });
  }
  
  try {
    const updatedLead = await db.addLeadNote(id, note.trim(), createdBy);
    res.status(200).json({ 
      lead: updatedLead,
      message: 'Note added successfully'
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ 
      error: 'Failed to add note',
      details: error.message
    });
  }
});

// Add tag to lead
app.post('/api/leads/:id/tags', async (req, res) => {
  const { id } = req.params;
  const { tag, createdBy = 'user' } = req.body;
  
  if (!tag || !tag.trim()) {
    return res.status(400).json({ error: 'Tag is required' });
  }
  
  try {
    const updatedLead = await db.addLeadTag(id, tag.trim(), createdBy);
    res.status(200).json({ 
      lead: updatedLead,
      message: 'Tag added successfully'
    });
  } catch (error) {
    console.error('Error adding tag:', error);
    res.status(500).json({ 
      error: 'Failed to add tag',
      details: error.message
    });
  }
});

// Remove tag from lead
app.delete('/api/leads/:id/tags/:tag', async (req, res) => {
  const { id, tag } = req.params;
  const { createdBy = 'user' } = req.body;
  
  try {
    const updatedLead = await db.removeLeadTag(id, tag, createdBy);
    res.status(200).json({ 
      lead: updatedLead,
      message: 'Tag removed successfully'
    });
  } catch (error) {
    console.error('Error removing tag:', error);
    res.status(500).json({ 
      error: 'Failed to remove tag',
      details: error.message
    });
  }
});

// Update lead fields with event tracking
app.put('/api/leads/:id', async (req, res) => {
  const { id } = req.params;
  const { updates, createdBy = 'user' } = req.body;
  
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Updates object is required' });
  }
  
  try {
    const updatedLead = await db.updateLeadWithEvent(id, updates, createdBy);
    res.status(200).json({ 
      lead: updatedLead,
      message: 'Lead updated successfully'
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ 
      error: 'Failed to update lead',
      details: error.message
    });
  }
});

// Bug report endpoint
app.post('/api/report-bug', async (req, res) => {
  const { message, userEmail, context } = req.body;
  
  if (!message || !message.trim()) {
    return res.status(400).json({ 
      ok: false,
      error: 'Message is required' 
    });
  }

  try {
    // Check if SMTP is configured
    const smtpConfigured = process.env.BUG_REPORT_SMTP_USER && 
                           process.env.BUG_REPORT_SMTP_PASS &&
                           process.env.BUG_REPORT_SMTP_HOST;

    if (!smtpConfigured) {
      // Log to console if SMTP not configured
      console.log('\n=== BUG REPORT (SMTP not configured) ===');
      console.log('From:', userEmail || 'Anonymous');
      console.log('Message:', message);
      console.log('Context:', JSON.stringify(context, null, 2));
      console.log('Timestamp:', new Date().toISOString());
      console.log('=====================================\n');
      
      return res.status(200).json({ 
        ok: true,
        message: 'Bug report logged (email not configured)'
      });
    }

    // Create SMTP transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.BUG_REPORT_SMTP_HOST,
      port: parseInt(process.env.BUG_REPORT_SMTP_PORT || '587'),
      secure: false, // use TLS
      auth: {
        user: process.env.BUG_REPORT_SMTP_USER,
        pass: process.env.BUG_REPORT_SMTP_PASS
      }
    });

    // Format email
    const emailHtml = `
      <h2>Bug Report from Desk.ai Demo</h2>
      <p><strong>From:</strong> ${userEmail || 'Anonymous user'}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      
      <h3>Issue Description:</h3>
      <p>${message.replace(/\n/g, '<br>')}</p>
      
      ${context ? `
        <h3>Context:</h3>
        <ul>
          <li><strong>Page:</strong> ${context.page || 'Unknown'}</li>
          <li><strong>User Agent:</strong> ${context.userAgent || 'Unknown'}</li>
          <li><strong>Timestamp:</strong> ${context.timestamp || 'Unknown'}</li>
        </ul>
      ` : ''}
    `;

    // Send email
    await transporter.sendMail({
      from: process.env.BUG_REPORT_FROM || 'noreply@desk.ai',
      to: process.env.BUG_REPORT_EMAIL || 'growzone.ai@gmail.com',
      subject: `[Desk.ai] Bug Report - ${new Date().toLocaleDateString()}`,
      html: emailHtml,
      text: `Bug Report\n\nFrom: ${userEmail || 'Anonymous'}\nTime: ${new Date().toISOString()}\n\nIssue:\n${message}\n\nContext: ${JSON.stringify(context, null, 2)}`
    });

    console.log('Bug report email sent successfully');

    res.status(200).json({ 
      ok: true,
      message: 'Bug report sent successfully'
    });

  } catch (error) {
    console.error('Error sending bug report:', error.message);
    res.status(500).json({ 
      ok: false,
      error: 'Failed to send bug report'
    });
  }
});

// ============================================================================
// APPOINTMENTS API - Manage jobs/appointments - Now with database persistence
// ============================================================================

// GET /api/appointments - List appointments with optional filtering
app.get('/api/appointments', async (req, res) => {
  let { businessId, status, urgency, startDate, endDate } = req.query;
  
  // Default to demo business if not provided (for demo/development mode)
  if (!businessId) {
    console.warn('⚠️  No businessId provided to /api/appointments, defaulting to demo-business-001');
    businessId = 'demo-business-001';
  }
  
  try {
    const filters = { businessId };
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    let appointments = await db.getAppointmentsByBusiness(businessId, filters);
    
    // Filter by urgency if provided (client-side for now)
    if (urgency) {
      appointments = appointments.filter(apt => apt.urgency === urgency);
    }
    
    res.status(200).json({ 
      ok: true,
      data: appointments,
      count: appointments.length,
      calendarEnabled: isCalendarEnabled()
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ 
      ok: false,
      error: 'Failed to fetch appointments',
      details: error.message
    });
  }
});

// POST /api/appointments - Create new appointment with database + optional calendar sync
app.post('/api/appointments', async (req, res) => {
  const { 
    businessId,
    leadId,
    customerPhone, 
    issueSummary, 
    zipCode, 
    preferredTimeText,
    scheduledDate,
    scheduledTime,
    urgency,
    sourceChannel,
    internalNotes
  } = req.body;
  
  // Validate required fields
  if (!businessId) {
    return res.status(400).json({
      ok: false,
      error: 'businessId is required'
    });
  }
  
  if (!customerPhone || !issueSummary) {
    return res.status(400).json({ 
      ok: false,
      error: 'customerPhone and issueSummary are required' 
    });
  }
  
  try {
    // If no leadId provided, try to find or create lead
    let finalLeadId = leadId;
    if (!finalLeadId && customerPhone) {
      const lead = await db.getOrCreateLead(businessId, customerPhone, sourceChannel || 'manual');
      finalLeadId = lead.id;
    }
    
    // Create the appointment in database
    const appointment = await db.createAppointment({
      leadId: finalLeadId,
      businessId,
      scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
      scheduledTime: scheduledTime || preferredTimeText,
      issueSummary,
      zipCode,
      urgency: urgency || 'normal',
      customerPhone,
      notes: internalNotes || ''
    });
    
    // Attempt to sync with Google Calendar if enabled and scheduled
    let calendarSynced = false;
    if (scheduledDate && scheduledTime && isCalendarEnabled()) {
      try {
        const eventId = await createAppointmentEvent({
          ...appointment,
          scheduledStart: `${scheduledDate}T${scheduledTime}`,
          scheduledEnd: `${scheduledDate}T${scheduledTime}` // TODO: Calculate end time
        });
        
        if (eventId) {
          // Update appointment with the calendar eventId
          await db.updateAppointment(appointment.id, { 
            notes: `${appointment.notes}\nGoogle Calendar Event ID: ${eventId}` 
          });
          appointment.eventId = eventId;
          calendarSynced = true;
        }
      } catch (calendarError) {
        // Log but don't fail - calendar sync is optional
        console.warn('⚠️  Failed to sync with calendar:', calendarError.message);
      }
    }
    
    res.status(201).json({ 
      ok: true,
      data: appointment,
      calendarSynced,
      message: calendarSynced 
        ? 'Appointment created and synced to Google Calendar'
        : 'Appointment created'
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ 
      ok: false,
      error: error.message || 'Failed to create appointment'
    });
  }
});

// PATCH /api/appointments/:id - Update appointment with database + optional calendar sync
app.patch('/api/appointments/:id', async (req, res) => {
  const { id } = req.params;
  const { status, scheduledDate, scheduledTime, internalNotes } = req.body;
  
  if (!id) {
    return res.status(400).json({ 
      ok: false,
      error: 'Appointment ID is required' 
    });
  }
  
  try {
    // Build updates object with only provided fields
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (scheduledDate !== undefined) updates.scheduled_date = scheduledDate;
    if (scheduledTime !== undefined) updates.scheduled_time = scheduledTime;
    if (internalNotes !== undefined) updates.notes = internalNotes;
    
    // Update in database
    const appointment = await db.updateAppointment(id, updates);
    
    // Attempt to sync with Google Calendar if enabled
    let calendarSynced = false;
    const hasEventId = appointment.notes && appointment.notes.includes('Google Calendar Event ID:');
    
    if (hasEventId && isCalendarEnabled()) {
      try {
        await updateAppointmentEvent({
          ...appointment,
          scheduledStart: `${appointment.scheduled_date}T${appointment.scheduled_time}`,
          scheduledEnd: `${appointment.scheduled_date}T${appointment.scheduled_time}`
        });
        calendarSynced = true;
      } catch (calendarError) {
        // Log but don't fail - calendar sync is optional
        console.warn('⚠️  Failed to sync update with calendar:', calendarError.message);
      }
    }
    
    res.status(200).json({ 
      ok: true,
      data: appointment,
      calendarSynced,
      message: calendarSynced 
        ? 'Appointment updated and synced to Google Calendar'
        : 'Appointment updated'
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ 
        ok: false,
        error: error.message
      });
    }
    
    res.status(500).json({ 
      ok: false,
      error: error.message || 'Failed to update appointment'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Database: ${supabase ? '✅ Connected' : '⚠️  Not configured (set SUPABASE_URL and SUPABASE_ANON_KEY)'}`);
  console.log(`📅 Google Calendar: ${isCalendarEnabled() ? '✅ Enabled' : '⚠️  Not configured'}`);
});
