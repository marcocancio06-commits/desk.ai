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
const googleCalendarOAuth = require('./googleCalendarOAuth');
const twilioService = require('./twilioService');
const { 
  getContextFromRequest, 
  requireAuth, 
  requireBusiness,
  requireBusinessOwnership,
  verifyBusinessAccess,
  getUserBusinesses 
} = require('./authHelper');
const logger = require('./logger');
const alertSystem = require('./alertSystem');
const smsQueue = require('./smsQueue');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ============================================================================
// LOGGING MIDDLEWARE
// ============================================================================
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log after response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  
  next();
});

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
  
  // SECURITY: business_id is REQUIRED
  if (!businessId) {
    return res.status(400).json({ 
      error: 'business_id required',
      code: 'BUSINESS_ID_REQUIRED'
    });
  }
  
  if (!message) {
    return res.status(400).json({ 
      error: 'Message is required' 
    });
  }
  
  try {
    // Verify business exists and is active
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }
    
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, is_active')
      .eq('id', businessId)
      .eq('is_active', true)
      .single();
    
    if (businessError || !business) {
      return res.status(404).json({
        error: 'Business not found or inactive',
        code: 'BUSINESS_NOT_FOUND'
      });
    }
    
    const targetFrom = from || 'unknown';
    
    // Get or create lead - ALWAYS scoped to businessId
    const lead = await db.getOrCreateLead(businessId, targetFrom, channel || 'web');
    
    // Verify lead belongs to correct business (double-check)
    if (lead.business_id !== businessId) {
      logger.error('Cross-tenant data leak prevented', {
        expectedBusinessId: businessId,
        actualBusinessId: lead.business_id,
        leadId: lead.id
      });
      return res.status(403).json({
        error: 'Data isolation error',
        code: 'FORBIDDEN'
      });
    }
    
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
      businessId: businessId,
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

// Get leads for a business - Protected endpoint (requires auth or demo mode)
app.get('/api/leads', requireBusiness, async (req, res) => {
  const { businessId, userId, isDemo } = req.authContext;
  let { status, urgency, limit } = req.query;
  
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
      count: leads.length,
      businessId,
      isDemo
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leads',
      details: error.message
    });
  }
});

// Get daily summary with metrics and AI-generated insights - Protected endpoint
app.get('/api/summary', requireBusiness, async (req, res) => {
  const { businessId } = req.authContext;
  
  try {
    // Get metrics for today and last 7 days from database
    const metricsToday = await db.getLeadStats(businessId, 0);
    const metricsLast7Days = await db.getLeadStats(businessId, 7);
    
    const metrics = {
      today: metricsToday,
      last7Days: metricsLast7Days
    };
    
    // Get ready-to-book appointments from database
    const allAppointments = await db.getAppointmentsByBusiness(businessId, {
      status: 'pending'
    });
    
    // Also get qualified leads that could be scheduled
    const qualifiedLeads = await db.getAllLeads(businessId, {
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
      businessId,
      metrics,
      appointments
    });
    
    // Calculate date range
    const today = new Date();
    const last7DaysStart = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    // Return complete summary
    res.status(200).json({
      businessId,
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

// Update a lead's fields - Now using database with business verification
app.patch('/api/leads/:id', requireAuth, requireBusinessOwnership, async (req, res) => {
  const { id } = req.params;
  const { status, urgency, scheduledTime, ownerNotes } = req.body;
  const { verifiedBusinessId } = req.authContext;
  
  if (!id) {
    return res.status(400).json({ 
      error: 'Lead ID is required in URL path' 
    });
  }
  
  try {
    // Get the lead first to verify it belongs to the business
    const lead = await db.getLeadById(id);
    
    if (!lead) {
      return res.status(404).json({
        error: 'Lead not found'
      });
    }
    
    // SECURITY: Verify lead belongs to the authenticated user's business
    if (lead.business_id !== verifiedBusinessId) {
      logger.warn('Attempted cross-tenant lead access', {
        userId: req.authContext.userId,
        requestedLeadId: id,
        leadBusinessId: lead.business_id,
        userBusinessId: verifiedBusinessId
      });
      return res.status(403).json({
        error: 'Access denied - lead belongs to different business',
        code: 'FORBIDDEN'
      });
    }
    
    // Build updates object
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (urgency !== undefined) updates.urgency = urgency;
    if (scheduledTime !== undefined) updates.preferred_time = scheduledTime;
    if (ownerNotes !== undefined) updates.internal_notes = ownerNotes;
    
    // Update the lead
    const updatedLead = await db.updateLead(id, updates);
    
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

// Get lead timeline (events + messages) - Protected
app.get('/api/leads/:id/timeline', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { userId, businessId, isDemo } = req.authContext;
  
  try {
    // Get the lead first to verify ownership
    const lead = await db.getLeadById(id);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    // SECURITY: Verify user has access to this lead's business
    if (!isDemo) {
      const { hasAccess } = await verifyBusinessAccess(userId, lead.business_id);
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'FORBIDDEN'
        });
      }
    }
    
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

// Get lead events only - Protected
app.get('/api/leads/:id/events', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { userId, isDemo } = req.authContext;
  
  try {
    // Get the lead first to verify ownership
    const lead = await db.getLeadById(id);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    // SECURITY: Verify user has access to this lead's business
    if (!isDemo) {
      const { hasAccess } = await verifyBusinessAccess(userId, lead.business_id);
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'FORBIDDEN'
        });
      }
    }
    
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

// Update lead status with event tracking - Protected
app.post('/api/leads/:id/status', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status, createdBy = 'user' } = req.body;
  const { userId, isDemo } = req.authContext;
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  
  try {
    // Get the lead first to verify ownership
    const lead = await db.getLeadById(id);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    // SECURITY: Verify user has access to this lead's business
    if (!isDemo) {
      const { hasAccess } = await verifyBusinessAccess(userId, lead.business_id);
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'FORBIDDEN'
        });
      }
    }
    
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

// Add note to lead - Protected
app.post('/api/leads/:id/notes', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { note, createdBy = 'user' } = req.body;
  const { userId, isDemo } = req.authContext;
  
  if (!note || !note.trim()) {
    return res.status(400).json({ error: 'Note is required' });
  }
  
  try {
    // Get the lead first to verify ownership
    const lead = await db.getLeadById(id);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    // SECURITY: Verify user has access to this lead's business
    if (!isDemo) {
      const { hasAccess } = await verifyBusinessAccess(userId, lead.business_id);
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'FORBIDDEN'
        });
      }
    }
    
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

// Add tag to lead - Protected
app.post('/api/leads/:id/tags', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { tag, createdBy = 'user' } = req.body;
  const { userId, isDemo } = req.authContext;
  
  if (!tag || !tag.trim()) {
    return res.status(400).json({ error: 'Tag is required' });
  }
  
  try {
    // Get the lead first to verify ownership
    const lead = await db.getLeadById(id);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    // SECURITY: Verify user has access to this lead's business
    if (!isDemo) {
      const { hasAccess } = await verifyBusinessAccess(userId, lead.business_id);
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'FORBIDDEN'
        });
      }
    }
    
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

// Remove tag from lead - Protected
app.delete('/api/leads/:id/tags/:tag', requireAuth, async (req, res) => {
  const { id, tag } = req.params;
  const { createdBy = 'user' } = req.body;
  const { userId, isDemo } = req.authContext;
  
  try {
    // Get the lead first to verify ownership
    const lead = await db.getLeadById(id);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    // SECURITY: Verify user has access to this lead's business
    if (!isDemo) {
      const { hasAccess } = await verifyBusinessAccess(userId, lead.business_id);
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'FORBIDDEN'
        });
      }
    }
    
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

// Update lead fields with event tracking - Protected
app.put('/api/leads/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { updates, createdBy = 'user' } = req.body;
  const { userId, isDemo } = req.authContext;
  
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Updates object is required' });
  }
  
  try {
    // Get the lead first to verify ownership
    const lead = await db.getLeadById(id);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    // SECURITY: Verify user has access to this lead's business
    if (!isDemo) {
      const { hasAccess } = await verifyBusinessAccess(userId, lead.business_id);
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'FORBIDDEN'
        });
      }
    }
    
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
// DEMO SCHEDULE ENDPOINT - No auth required for demo purposes
// ============================================================================
app.post('/api/demo/schedule', async (req, res) => {
  try {
    const { phone, zipCode, issue, preferredTime, urgency, date, time, duration, notes } = req.body;
    
    // For demo purposes, just return success without saving to DB
    // In production, this would create an actual appointment
    
    console.log('[DEMO] Schedule request:', { phone, zipCode, issue, preferredTime, date, time });
    
    res.json({
      ok: true,
      success: true,
      message: 'Demo appointment scheduled successfully!',
      data: {
        id: 'demo-' + Date.now(),
        phone,
        zipCode,
        issue,
        preferredTime,
        date,
        time,
        duration,
        notes,
        status: 'scheduled',
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[DEMO] Schedule error:', error);
    res.status(500).json({ ok: false, success: false, error: 'Failed to schedule demo appointment' });
  }
});

// ============================================================================
// DEMO LEADS ENDPOINT - Fetch leads without auth for demo dashboard
// ============================================================================
app.get('/api/demo/leads', async (req, res) => {
  try {
    const { businessId } = req.query;
    
    if (!businessId) {
      return res.status(400).json({ ok: false, error: 'businessId query parameter required' });
    }

    console.log('[DEMO] Fetching leads for business:', businessId);

    // Fetch leads from database (getAllLeads is the correct function name)
    const leads = await db.getAllLeads(businessId);
    
    console.log(`[DEMO] Found ${leads.length} leads for business ${businessId}`);

    res.json({ 
      ok: true,
      leads: leads || [],
      count: leads.length
    });
  } catch (error) {
    console.error('[DEMO] Error fetching leads:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch leads', details: error.message });
  }
});

// ============================================================================
// APPOINTMENTS API - Manage jobs/appointments - Now with database persistence
// ============================================================================

// GET /api/appointments - List appointments with optional filtering (Protected)
app.get('/api/appointments', requireBusiness, async (req, res) => {
  const { businessId } = req.authContext;
  let { status, urgency, startDate, endDate } = req.query;
  
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

// POST /api/appointments - Create new appointment with database + optional calendar sync (Protected)
app.post('/api/appointments', requireBusiness, async (req, res) => {
  const { businessId: authBusinessId } = req.authContext;
  const { 
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
  
  // Use authenticated business ID
  const businessId = authBusinessId;
  
  // Validate required fields
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
app.patch('/api/appointments/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status, scheduledDate, scheduledTime, internalNotes, urgency } = req.body;
  const { userId, isDemo } = req.authContext;
  
  if (!id) {
    return res.status(400).json({ 
      ok: false,
      error: 'Appointment ID is required' 
    });
  }
  
  try {
    // Get appointment first to verify ownership
    const existingAppointment = await db.getAppointmentById(id);
    
    if (!existingAppointment) {
      return res.status(404).json({
        ok: false,
        error: 'Appointment not found'
      });
    }
    
    // SECURITY: Verify user has access to this appointment's business
    if (!isDemo) {
      const { hasAccess } = await verifyBusinessAccess(userId, existingAppointment.business_id);
      if (!hasAccess) {
        logger.warn('Attempted cross-tenant appointment access', {
          userId,
          appointmentId: id,
          appointmentBusinessId: existingAppointment.business_id
        });
        return res.status(403).json({
          ok: false,
          error: 'Access denied',
          code: 'FORBIDDEN'
        });
      }
    }
    
    // Build updates object with only provided fields
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (scheduledDate !== undefined) updates.scheduled_date = scheduledDate;
    if (scheduledTime !== undefined) updates.scheduled_time = scheduledTime;
    if (internalNotes !== undefined) updates.notes = internalNotes;
    if (urgency !== undefined) updates.urgency = urgency;
    
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

// ============================================================================
// GOOGLE CALENDAR OAUTH ROUTES
// ============================================================================

// Get connection status
app.get('/api/google/status', async (req, res) => {
  const businessId = req.query.businessId || 'demo-business-001';
  
  // Check if OAuth is configured first
  if (!googleCalendarOAuth.isConfigured()) {
    // Return a clean "coming soon" response instead of error
    return res.status(200).json({ 
      ok: true, 
      data: { 
        connected: false, 
        comingSoon: true,
        message: 'Google Calendar sync is coming soon'
      }
    });
  }
  
  try {
    const status = await googleCalendarOAuth.getConnectionStatus(businessId);
    res.status(200).json({ ok: true, data: status });
  } catch (error) {
    console.error('Error getting calendar status:', error);
    res.status(500).json({ 
      ok: false,
      error: error.message 
    });
  }
});

// Initiate OAuth flow
app.get('/api/google/connect', (req, res) => {
  const businessId = req.query.businessId || 'demo-business-001';
  
  console.log(`🔗 Google Calendar connect request for business: ${businessId}`);
  
  // Check if OAuth is configured
  if (!googleCalendarOAuth.isConfigured()) {
    console.log('ℹ️  Google Calendar OAuth is not configured (feature coming soon)');
    
    return res.status(200).json({ 
      ok: false,
      error: 'Google Calendar sync is coming soon. For now, use Desk.ai to track leads and appointments manually.',
      code: 'FEATURE_COMING_SOON'
    });
  }
  
  try {
    const authUrl = googleCalendarOAuth.getAuthUrl(businessId);
    console.log(`✅ Generated auth URL for business: ${businessId}`);
    
    res.status(200).json({ 
      ok: true,
      authUrl 
    });
  } catch (error) {
    console.error('❌ Error generating auth URL:', error.message);
    console.error('   Error details:', error);
    
    // Check if it's a configuration error
    if (error.code === 'OAUTH_NOT_CONFIGURED') {
      return res.status(503).json({ 
        ok: false,
        error: 'Google Calendar is not configured on the server',
        details: error.message,
        missingVars: error.missingVars,
        code: 'OAUTH_NOT_CONFIGURED'
      });
    }
    
    res.status(500).json({ 
      ok: false,
      error: 'Failed to initiate Google Calendar connection',
      details: error.message 
    });
  }
});

// OAuth callback - Handle the redirect from Google
app.get('/api/google/callback', async (req, res) => {
  const { code, state } = req.query;
  const businessId = state || 'demo-business-001';
  
  if (!code) {
    return res.status(400).send('Authorization code missing');
  }
  
  try {
    // Exchange code for tokens
    const tokens = await googleCalendarOAuth.exchangeCodeForTokens(code);
    
    // Save tokens to database
    await googleCalendarOAuth.saveTokens(businessId, tokens);
    
    // Redirect to frontend settings page with success
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/settings?calendar=connected`;
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/settings?calendar=error`;
    res.redirect(redirectUrl);
  }
});

// Disconnect calendar
app.post('/api/google/disconnect', async (req, res) => {
  const { businessId } = req.body;
  
  if (!businessId) {
    return res.status(400).json({ 
      ok: false,
      error: 'Business ID is required' 
    });
  }
  
  try {
    await googleCalendarOAuth.disconnectCalendar(businessId);
    res.status(200).json({ 
      ok: true,
      message: 'Calendar disconnected successfully' 
    });
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    res.status(500).json({ 
      ok: false,
      error: error.message 
    });
  }
});

// Trigger manual sync
app.post('/api/google/sync', async (req, res) => {
  const { businessId } = req.body;
  
  if (!businessId) {
    return res.status(400).json({ 
      ok: false,
      error: 'Business ID is required' 
    });
  }
  
  try {
    const result = await googleCalendarOAuth.syncCalendar(businessId);
    res.status(200).json({ 
      ok: true,
      data: result 
    });
  } catch (error) {
    console.error('Error syncing calendar:', error);
    res.status(500).json({ 
      ok: false,
      error: error.message 
    });
  }
});

// Get conflicts for an appointment - Protected
app.get('/api/appointments/:id/conflicts', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { userId, isDemo } = req.authContext;
  
  try {
    // Get appointment first to verify ownership
    const appointment = await db.getAppointmentById(id);
    
    if (!appointment) {
      return res.status(404).json({
        ok: false,
        error: 'Appointment not found'
      });
    }
    
    // SECURITY: Verify user has access to this appointment's business
    if (!isDemo) {
      const { hasAccess } = await verifyBusinessAccess(userId, appointment.business_id);
      if (!hasAccess) {
        return res.status(403).json({
          ok: false,
          error: 'Access denied',
          code: 'FORBIDDEN'
        });
      }
    }
    
    const conflicts = await db.getAppointmentConflicts(id);
    res.status(200).json({ 
      ok: true,
      data: conflicts 
    });
  } catch (error) {
    console.error('Error getting conflicts:', error);
    res.status(500).json({ 
      ok: false,
      error: error.message 
    });
  }
});

// Resolve a conflict - Protected
app.post('/api/conflicts/:id/resolve', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { resolvedBy } = req.body;
  const { userId, isDemo } = req.authContext;
  
  try {
    // Get conflict first
    const conflictData = await db.getConflictById(id);
    
    if (!conflictData) {
      return res.status(404).json({
        ok: false,
        error: 'Conflict not found'
      });
    }
    
    // Get associated appointment to verify ownership
    const appointment = await db.getAppointmentById(conflictData.appointment_id);
    
    if (!appointment) {
      return res.status(404).json({
        ok: false,
        error: 'Associated appointment not found'
      });
    }
    
    // SECURITY: Verify user has access to this conflict's business
    if (!isDemo) {
      const { hasAccess } = await verifyBusinessAccess(userId, appointment.business_id);
      if (!hasAccess) {
        return res.status(403).json({
          ok: false,
          error: 'Access denied',
          code: 'FORBIDDEN'
        });
      }
    }
    
    const conflict = await db.resolveConflict(id, resolvedBy || 'user');
    
    // Update appointment to remove conflict flag if no more conflicts
    if (conflict && conflict.appointment_id) {
      const remainingConflicts = await db.getAppointmentConflicts(conflict.appointment_id);
      if (remainingConflicts.length === 0) {
        await db.updateAppointment(conflict.appointment_id, { hasConflict: false });
      }
    }
    
    res.status(200).json({ 
      ok: true,
      data: conflict 
    });
  } catch (error) {
    console.error('Error resolving conflict:', error);
    res.status(500).json({ 
      ok: false,
      error: error.message 
    });
  }
});

// ============================================================================
// TWILIO SMS ROUTES
// ============================================================================

// Get Twilio configuration status
app.get('/api/twilio/status', (req, res) => {
  try {
    const status = twilioService.getStatus();
    res.status(200).json({ ok: true, data: status });
  } catch (error) {
    console.error('Error getting Twilio status:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Inbound SMS webhook from Twilio
app.post('/api/twilio/sms/inbound', async (req, res) => {
  try {
    // Validate webhook signature (security)
    const twilioSignature = req.headers['x-twilio-signature'];
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    
    if (twilioService.isConfigured() && !twilioService.validateWebhookSignature(twilioSignature, url, req.body)) {
      console.error('❌ Invalid Twilio webhook signature');
      return res.status(403).send('Forbidden');
    }

    // Parse incoming SMS
    const incomingMessage = twilioService.parseIncomingSMS(req.body);
    console.log('📱 Incoming SMS:', {
      from: incomingMessage.from,
      body: incomingMessage.body.substring(0, 50) + '...'
    });

    // Get or create lead based on phone number
    let lead = await db.getLeadByPhone(incomingMessage.from);
    
    if (!lead) {
      console.log('📝 Creating new lead from SMS');
      lead = await db.createLead({
        phone: incomingMessage.from,
        name: incomingMessage.fromCity ? `Customer from ${incomingMessage.fromCity}` : 'SMS Customer',
        source: 'sms',
        status: 'new',
        businessId: 1 // Default business ID
      });
    }

    // Save incoming SMS to database
    await db.createSMSMessage({
      leadId: lead.id,
      twilioSid: incomingMessage.messageSid,
      twilioAccountSid: incomingMessage.accountSid,
      direction: 'inbound',
      fromNumber: incomingMessage.from,
      toNumber: incomingMessage.to,
      body: incomingMessage.body,
      status: 'received',
      numMedia: incomingMessage.numMedia,
      fromCity: incomingMessage.fromCity,
      fromState: incomingMessage.fromState,
      fromZip: incomingMessage.fromZip,
      fromCountry: incomingMessage.fromCountry
    });

    // Get conversation history
    const conversationHistory = await db.getSMSMessagesByLead(lead.id);
    const messages = conversationHistory.map(msg => ({
      role: msg.direction === 'inbound' ? 'user' : 'assistant',
      content: msg.body
    }));

    // Run AI pipeline to generate response
    const aiResponse = await handleCustomerMessage({
      message: incomingMessage.body,
      customerPhone: incomingMessage.from,
      leadId: lead.id,
      conversationHistory: messages
    });

    // Update lead with AI insights
    if (aiResponse) {
      await db.updateLeadFromAIResponse(lead.id, aiResponse);
    }

    // Send AI response via SMS
    let replyText = aiResponse?.response || "Thanks for your message! We'll get back to you shortly.";
    
    if (twilioService.isConfigured()) {
      try {
        const sentMessage = await twilioService.sendSMS(incomingMessage.from, replyText);
        
        // Save outbound SMS to database
        await db.createSMSMessage({
          leadId: lead.id,
          twilioSid: sentMessage.sid,
          twilioAccountSid: twilioService.accountSid,
          direction: 'outbound',
          fromNumber: sentMessage.from,
          toNumber: sentMessage.to,
          body: replyText,
          status: sentMessage.status
        });
      } catch (smsError) {
        console.error('❌ Error sending SMS reply:', smsError.message);
        // Continue anyway - don't fail the webhook
      }
    }

    // Return TwiML response (Twilio expects this)
    const twiml = twilioService.createTwiMLResponse();
    res.type('text/xml');
    res.send(twiml);

  } catch (error) {
    console.error('❌ Error processing inbound SMS:', error);
    
    // Return empty TwiML to prevent Twilio from retrying
    const twiml = twilioService.createTwiMLResponse();
    res.type('text/xml');
    res.send(twiml);
  }
});

// Outbound SMS - Send SMS from dashboard (Protected)
app.post('/api/twilio/sms/outbound', requireAuth, async (req, res) => {
  const { leadId, phoneNumber, message } = req.body;
  const { userId, isDemo } = req.authContext;

  if (!leadId || !phoneNumber || !message) {
    return res.status(400).json({ 
      ok: false, 
      error: 'leadId, phoneNumber, and message are required' 
    });
  }

  if (!twilioService.isConfigured()) {
    return res.status(503).json({ 
      ok: false, 
      error: 'Twilio is not configured. Please add credentials to .env file.' 
    });
  }

  try {
    // Get the lead first to verify ownership
    const lead = await db.getLeadById(leadId);
    
    if (!lead) {
      return res.status(404).json({
        ok: false,
        error: 'Lead not found'
      });
    }
    
    // SECURITY: Verify user has access to this lead's business
    if (!isDemo) {
      const { hasAccess } = await verifyBusinessAccess(userId, lead.business_id);
      if (!hasAccess) {
        return res.status(403).json({
          ok: false,
          error: 'Access denied',
          code: 'FORBIDDEN'
        });
      }
    }
    
    // Format phone number
    const formattedPhone = twilioService.formatPhoneNumber(phoneNumber);

    // Send SMS via Twilio
    const sentMessage = await twilioService.sendSMS(formattedPhone, message);

    // Save to database
    const dbMessage = await db.createSMSMessage({
      leadId,
      twilioSid: sentMessage.sid,
      twilioAccountSid: twilioService.accountSid,
      direction: 'outbound',
      fromNumber: sentMessage.from,
      toNumber: sentMessage.to,
      body: message,
      status: sentMessage.status
    });

    res.status(200).json({ 
      ok: true, 
      data: {
        message: dbMessage,
        twilioStatus: sentMessage.status
      }
    });

  } catch (error) {
    console.error('❌ Error sending outbound SMS:', error);
    res.status(500).json({ 
      ok: false, 
      error: error.message 
    });
  }
});

// Get SMS messages for a lead (Protected)
app.get('/api/leads/:leadId/sms', requireAuth, async (req, res) => {
  const { leadId } = req.params;
  const { userId, isDemo } = req.authContext;

  try {
    // Get the lead first to verify ownership
    const lead = await db.getLeadById(leadId);
    
    if (!lead) {
      return res.status(404).json({
        ok: false,
        error: 'Lead not found'
      });
    }
    
    // SECURITY: Verify user has access to this lead's business
    if (!isDemo) {
      const { hasAccess } = await verifyBusinessAccess(userId, lead.business_id);
      if (!hasAccess) {
        return res.status(403).json({
          ok: false,
          error: 'Access denied',
          code: 'FORBIDDEN'
        });
      }
    }
    
    const messages = await db.getSMSMessagesByLead(leadId);
    res.status(200).json({ ok: true, data: messages });
  } catch (error) {
    console.error('Error getting SMS messages:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// SMS delivery status webhook (optional - for tracking)
app.post('/api/twilio/sms/status', async (req, res) => {
  try {
    const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = req.body;
    
    console.log(`📱 SMS Status Update: ${MessageSid} -> ${MessageStatus}`);
    
    // Update message status in database
    if (MessageSid) {
      await db.updateSMSMessageStatus(MessageSid, MessageStatus, ErrorCode, ErrorMessage);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing SMS status update:', error);
    res.status(200).send('OK'); // Always return 200 to Twilio
  }
});

// ============================================================================
// CRON JOB - Auto-sync every 5 minutes
// ============================================================================

let syncInterval = null;

function startAutoSync() {
  // Check if OAuth is configured
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID) {
    console.log('📅 Google Calendar OAuth not configured, skipping auto-sync');
    return;
  }
  
  // Clear existing interval if any
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  // Run sync every 5 minutes
  syncInterval = setInterval(async () => {
    try {
      console.log('🔄 Running scheduled calendar sync...');
      
      // Get all businesses with active Google Calendar connections
      const { data: activeConnections } = await supabase
        .from('google_calendar_tokens')
        .select('business_id')
        .eq('is_active', true);
      
      if (!activeConnections || activeConnections.length === 0) {
        console.log('📅 No active calendar connections found');
        return;
      }
      
      // Sync each connected business
      for (const conn of activeConnections) {
        try {
          await googleCalendarOAuth.syncCalendar(conn.business_id);
        } catch (error) {
          console.error(`Error syncing ${conn.business_id}:`, error.message);
        }
      }
      
      console.log('✅ Scheduled sync complete');
      
    } catch (error) {
      console.error('Error in scheduled sync:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes
  
  console.log('✅ Auto-sync enabled (every 5 minutes)');
}

// ============================================================================
// ADMIN API - System monitoring and logs
// ============================================================================

// GET /api/admin/logs - Get recent system logs
app.get('/api/admin/logs', requireAuth, async (req, res) => {
  try {
    const { lines = 100, errorOnly = 'false' } = req.query;
    const logs = logger.getRecentLogs(parseInt(lines), errorOnly === 'true');
    
    res.json({
      ok: true,
      logs,
      count: logs.length,
      errorOnly: errorOnly === 'true'
    });
  } catch (error) {
    logger.error('Failed to fetch logs', { error: error.message });
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch logs'
    });
  }
});

// GET /api/admin/sms-queue - Get SMS queue status
app.get('/api/admin/sms-queue', requireAuth, async (req, res) => {
  try {
    const status = smsQueue.getStatus();
    res.json({
      ok: true,
      ...status
    });
  } catch (error) {
    logger.error('Failed to fetch SMS queue status', { error: error.message });
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch queue status'
    });
  }
});

// ============================================================================
// GLOBAL ERROR HANDLER - Must be after all routes
// ============================================================================

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode
  });
  
  // Alert on critical server errors
  if (statusCode >= 500) {
    alertSystem.alertResourceIssue('Server Error', {
      error: err.message,
      path: req.path,
      method: req.method,
      stack: err.stack
    });
  }
  
  res.status(statusCode).json({
    ok: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Database: ${supabase ? '✅ Connected' : '⚠️  Not configured (set SUPABASE_URL and SUPABASE_ANON_KEY)'}`);
  
  // Check Google Calendar OAuth configuration
  if (googleCalendarOAuth.isConfigured()) {
    console.log(`📅 Google Calendar OAuth: ✅ Configured`);
    console.log(`   Client ID: ${process.env.GOOGLE_OAUTH_CLIENT_ID?.substring(0, 20)}...`);
    console.log(`   Redirect URI: ${process.env.GOOGLE_OAUTH_REDIRECT_URI}`);
  } else {
    console.log(`📅 Google Calendar OAuth: ⚠️  Not configured`);
    console.log(`   To enable: Add GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URI to .env`);
    console.log(`   See GOOGLE_CALENDAR_SETUP.md for instructions`);
  }
  
  // Check Twilio SMS configuration
  if (twilioService.isConfigured()) {
    const status = twilioService.getStatus();
    console.log(`📱 Twilio SMS: ✅ Configured (${status.testMode ? 'TEST' : 'PRODUCTION'} mode)`);
    console.log(`   Phone: ${status.phoneNumber}`);
    console.log(`   Account: ${status.accountSid}`);
    if (status.testMode) {
      console.log(`   ⚠️  Test Mode: Only works with verified numbers in Twilio sandbox`);
    }
  } else {
    console.log(`📱 Twilio SMS: ⚠️  Not configured`);
    console.log(`   To enable: Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to .env`);
    console.log(`   See TWILIO_SETUP.md for instructions`);
  }

  // Check Auth configuration
  console.log(`🔐 Supabase Auth: ${supabase ? '✅ Configured' : '⚠️  Not configured'}`);
  
  // Log reliability systems status
  logger.info('🛡️  Reliability systems initialized', {
    logging: '✅ Enabled',
    retryLogic: '✅ Enabled',
    alerts: process.env.ALERT_EMAIL_USER ? '✅ Configured' : '⚠️  Not configured',
    smsQueue: '✅ Active'
  });
  
  // Start auto-sync if OAuth is configured
  startAutoSync();
});

// ============================================================================
// AUTH API - User authentication and business access
// ============================================================================

// GET /api/auth/me - Get current user profile and businesses
app.get('/api/auth/me', requireAuth, async (req, res) => {
  const { userId, businessId, profile, business, isDemo } = req.authContext;
  
  try {
    // Get all businesses the user has access to
    const businesses = await getUserBusinesses(userId);
    
    res.status(200).json({
      ok: true,
      user: {
        id: userId,
        profile
      },
      currentBusiness: business,
      businesses,
      isDemo
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch user information',
      details: error.message
    });
  }
});

// GET /api/business/:slug - Get public business info by slug (no auth required)
app.get('/api/business/:slug', async (req, res) => {
  const { slug } = req.params;
  
  try {
    logger.info('Fetching business by slug', { slug });
    
    if (!supabase) {
      return res.status(500).json({
        ok: false,
        error: 'Database not configured'
      });
    }
    
    // Query Supabase for business by slug
    const { data: business, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    
    if (error) {
      logger.warn('Business not found', { slug, error: error.message });
      return res.status(404).json({
        ok: false,
        error: 'Business not found'
      });
    }
    
    if (!business) {
      return res.status(404).json({
        ok: false,
        error: 'Business not found'
      });
    }
    
    logger.info('Business found', { slug, businessId: business.id });
    
    // Return public business info (hide sensitive data)
    res.json({
      ok: true,
      business: {
        id: business.id,
        slug: business.slug,
        name: business.name,
        phone: business.phone,
        email: business.email,
        industry: business.industry,
        tagline: business.tagline,
        short_description: business.short_description,
        is_public: business.is_public,
        logo_url: business.logo_url,
        zip_codes: business.zip_codes || business.service_zip_codes || [],
        serviceZipCodes: business.zip_codes || business.service_zip_codes || [], // Backward compatibility
        services: business.services || [],
        hours: business.hours || {},
        pricing: business.pricing || {},
        policies: business.policies || {},
        emergencyPolicy: business.emergency_policy
      }
    });
  } catch (error) {
    logger.error('Error fetching business', { slug, error: error.message });
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch business',
      details: error.message
    });
  }
});

// GET /api/businesses - Get all active businesses (public, no auth required)
app.get('/api/businesses', async (req, res) => {
  try {
    logger.info('Fetching all active businesses');
    
    if (!supabase) {
      return res.status(500).json({
        ok: false,
        error: 'Database not configured'
      });
    }
    
    // Query all active businesses
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error('Error fetching businesses', { error: error.message });
      return res.status(500).json({
        ok: false,
        error: 'Failed to fetch businesses'
      });
    }
    
    // Return public business info
    const publicBusinesses = (businesses || []).map(business => ({
      id: business.id,
      slug: business.slug,
      name: business.name,
      phone: business.phone,
      email: business.email,
      industry: business.industry,
      logo_url: business.logo_url,
      zip_codes: business.zip_codes || business.service_zip_codes || [],
      serviceZipCodes: business.zip_codes || business.service_zip_codes || [], // Backward compatibility
      color_scheme: business.color_scheme || 'default',
      services: business.services || [],
      hours: business.hours || {},
      pricing: business.pricing || {},
      policies: business.policies || {}
    }));
    
    logger.info('Businesses fetched', { count: publicBusinesses.length });
    
    res.json({
      ok: true,
      businesses: publicBusinesses,
      count: publicBusinesses.length
    });
  } catch (error) {
    logger.error('Error fetching businesses', { error: error.message });
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch businesses',
      details: error.message
    });
  }
});

// GET /api/marketplace - Get all listed businesses for marketplace (public, no auth required)
// FEATURE FLAG: Controlled by MARKETPLACE_ENABLED in lib/featureFlags.js
app.get('/api/marketplace', async (req, res) => {
  try {
    const { MARKETPLACE_ENABLED } = require('./lib/featureFlags');
    
    // FEATURE FLAG: Return empty array if marketplace is disabled
    if (!MARKETPLACE_ENABLED) {
      logger.info('Marketplace disabled via feature flag');
      return res.json({
        ok: true,
        businesses: [],
        message: 'Marketplace feature is currently disabled'
      });
    }
    
    logger.info('Fetching marketplace businesses');
    
    if (!supabase) {
      return res.status(500).json({
        ok: false,
        error: 'Database not configured'
      });
    }
    
    // Use service role client to bypass RLS for public marketplace query
    const { createClient } = require('@supabase/supabase-js');
    const supabaseServiceRole = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Query all active AND public businesses
    const { data: businesses, error } = await supabaseServiceRole
      .from('businesses')
      .select('*')
      .eq('is_active', true)
      .eq('is_public', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error('Error fetching marketplace businesses', { 
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return res.status(500).json({
        ok: false,
        error: 'Failed to fetch marketplace businesses',
        debug: {
          message: error.message,
          code: error.code,
          hint: error.hint
        }
      });
    }
    
    // Return public business info for marketplace
    const marketplaceBusinesses = (businesses || []).map(business => ({
      id: business.id,
      slug: business.slug,
      name: business.name,
      industry: business.industry,
      tagline: business.tagline,
      short_description: business.short_description,
      service_zip_codes: business.service_zip_codes || [],
      logo_url: business.logo_url
    }));
    
    logger.info('Marketplace businesses fetched', { count: marketplaceBusinesses.length });
    
    res.json({
      ok: true,
      businesses: marketplaceBusinesses,
      count: marketplaceBusinesses.length
    });
  } catch (error) {
    logger.error('Error fetching marketplace businesses', { error: error.message });
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch marketplace businesses',
      details: error.message
    });
  }
});

// GET /api/auth/businesses - Get all businesses for current user
app.get('/api/auth/businesses', requireAuth, async (req, res) => {
  const { userId } = req.authContext;
  
  try {
    const businesses = await getUserBusinesses(userId);
    
    res.status(200).json({
      ok: true,
      businesses,
      count: businesses.length
    });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch businesses',
      details: error.message
    });
  }
});

// GET /api/business/:businessId/team - Get team members for a business (Protected)
app.get('/api/business/:businessId/team', requireAuth, requireBusinessOwnership, async (req, res) => {
  const { verifiedBusinessId } = req.authContext;
  
  try {
    // Get active team members
    const { data, error } = await supabase
      .from('business_users')
      .select(`
        user_id,
        role,
        is_default,
        created_at,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .eq('business_id', verifiedBusinessId);
    
    if (error) throw error;
    
    // Get user emails from auth.users (profiles.email may not be populated)
    const teamWithEmails = [];
    for (const member of data || []) {
      const { data: authUser } = await supabase.auth.admin.getUserById(member.user_id);
      teamWithEmails.push({
        user_id: member.user_id,
        email: authUser?.user?.email || member.profiles?.email || 'Unknown',
        role: member.role,
        is_default: member.is_default,
        full_name: member.profiles?.full_name,
        created_at: member.created_at,
        status: 'active'
      });
    }
    
    // Get pending invites
    const { data: invites, error: inviteError } = await supabase
      .from('team_invites')
      .select('*')
      .eq('business_id', verifiedBusinessId)
      .gte('expires_at', new Date().toISOString()); // Only non-expired
    
    if (inviteError) throw inviteError;
    
    const pendingInvites = (invites || []).map(invite => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      created_at: invite.created_at,
      expires_at: invite.expires_at,
      status: 'pending'
    }));
    
    res.status(200).json({
      ok: true,
      team: teamWithEmails,
      pending: pendingInvites,
      count: teamWithEmails.length,
      pendingCount: pendingInvites.length
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch team members',
      details: error.message
    });
  }
});

// POST /api/business/:businessId/invite - Invite a team member (Protected)
app.post('/api/business/:businessId/invite', requireAuth, requireBusinessOwnership, async (req, res) => {
  const { verifiedBusinessId, businessRole, userId: inviterId } = req.authContext;
  const { email, role } = req.body;
  
  if (!email || !role) {
    return res.status(400).json({
      ok: false,
      error: 'Email and role are required'
    });
  }
  
  if (!['staff', 'owner'].includes(role)) {
    return res.status(400).json({
      ok: false,
      error: 'Role must be staff or owner'
    });
  }
  
  // SECURITY: Only owners can invite team members
  if (businessRole !== 'owner') {
    return res.status(403).json({
      ok: false,
      error: 'Only owners can invite team members',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  
  try {
    // Check if user exists in Supabase Auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    if (existingUser) {
      // User already exists - add them directly to business_users
      const userId = existingUser.id;
      
      // Check if already linked to this business
      const { data: existing } = await supabase
        .from('business_users')
        .select('*')
        .eq('user_id', userId)
        .eq('business_id', verifiedBusinessId)
        .single();
      
      if (existing) {
        return res.status(400).json({
          ok: false,
          error: 'User is already a team member of this business'
        });
      }
      
      // Link user to business
      const { error: linkError } = await supabase
        .from('business_users')
        .insert({
          user_id: userId,
          business_id: verifiedBusinessId,
          role: role,
          is_default: false
        });
      
      if (linkError) throw linkError;
      
      logger.info(`Existing user added to team`, {
        businessId: verifiedBusinessId,
        email,
        role,
        userId,
        invitedBy: inviterId
      });
      
      return res.status(200).json({
        ok: true,
        message: 'Team member added successfully',
        type: 'direct_add',
        userId
      });
    } else {
      // User doesn't exist - create a placeholder invite
      // Check if invite already exists
      const { data: existingInvite } = await supabase
        .from('team_invites')
        .select('*')
        .eq('business_id', verifiedBusinessId)
        .eq('email', email)
        .single();
      
      if (existingInvite) {
        return res.status(400).json({
          ok: false,
          error: 'An invitation has already been sent to this email'
        });
      }
      
      // Create invite
      const { error: inviteError } = await supabase
        .from('team_invites')
        .insert({
          business_id: verifiedBusinessId,
          email,
          role,
          invited_by: inviterId
        });
      
      if (inviteError) throw inviteError;
      
      logger.info(`Team invite created (placeholder)`, {
        businessId: verifiedBusinessId,
        email,
        role,
        invitedBy: inviterId
      });
      
      return res.status(200).json({
        ok: true,
        message: 'Invitation created. User will need to sign up first.',
        type: 'pending_invite'
      });
    }
  } catch (error) {
    console.error('Error inviting team member:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to invite team member',
      details: error.message
    });
  }
});

// DELETE /api/business/:businessId/team/:userId - Remove team member (Protected)
app.delete('/api/business/:businessId/team/:userId', requireAuth, requireBusinessOwnership, async (req, res) => {
  const { verifiedBusinessId, businessRole, userId: requesterId } = req.authContext;
  const { userId: targetUserId } = req.params;
  
  // SECURITY: Only owners can remove team members
  if (businessRole !== 'owner') {
    return res.status(403).json({
      ok: false,
      error: 'Only owners can remove team members',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  
  // Prevent removing yourself
  if (targetUserId === requesterId) {
    return res.status(400).json({
      ok: false,
      error: 'You cannot remove yourself from the team'
    });
  }
  
  try {
    const { error } = await supabase
      .from('business_users')
      .delete()
      .eq('business_id', verifiedBusinessId)
      .eq('user_id', targetUserId);
    
    if (error) throw error;
    
    logger.info(`Team member removed`, {
      businessId: verifiedBusinessId,
      removedUserId: targetUserId,
      removedBy: requesterId
    });
    
    res.status(200).json({
      ok: true,
      message: 'Team member removed successfully'
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to remove team member',
      details: error.message
    });
  }
});

// DELETE /api/business/:businessId/invite/:inviteId - Delete pending invite (Protected)
app.delete('/api/business/:businessId/invite/:inviteId', requireAuth, requireBusinessOwnership, async (req, res) => {
  const { verifiedBusinessId, businessRole } = req.authContext;
  const { inviteId } = req.params;
  
  // SECURITY: Only owners can delete invites
  if (businessRole !== 'owner') {
    return res.status(403).json({
      ok: false,
      error: 'Only owners can delete invitations',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  
  try {
    const { error } = await supabase
      .from('team_invites')
      .delete()
      .eq('id', inviteId)
      .eq('business_id', verifiedBusinessId); // Ensure ownership
    
    if (error) throw error;
    
    logger.info(`Team invite deleted`, {
      businessId: verifiedBusinessId,
      inviteId
    });
    
    res.status(200).json({
      ok: true,
      message: 'Invitation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting invite:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to delete invitation',
      details: error.message
    });
  }
});

// ============================================================================
// BUSINESS ONBOARDING
// ============================================================================

// POST /api/business/create - Create new business during onboarding (Protected)
app.post('/api/business/create', requireAuth, async (req, res) => {
  const { userId } = req.authContext;
  const { 
    businessName, industry, phone, email, zipCodes, 
    isPublic, tagline, shortDescription,
    logoPath, colorScheme 
  } = req.body;
  
  // Validation
  if (!businessName || businessName.trim().length < 2) {
    return res.status(400).json({
      ok: false,
      error: 'Business name is required (minimum 2 characters)',
      code: 'INVALID_BUSINESS_NAME'
    });
  }
  
  if (!industry) {
    return res.status(400).json({
      ok: false,
      error: 'Industry is required',
      code: 'INVALID_INDUSTRY'
    });
  }
  
  if (!phone) {
    return res.status(400).json({
      ok: false,
      error: 'Phone number is required',
      code: 'INVALID_PHONE'
    });
  }
  
  if (!email) {
    return res.status(400).json({
      ok: false,
      error: 'Email is required',
      code: 'INVALID_EMAIL'
    });
  }
  
  if (!Array.isArray(zipCodes) || zipCodes.length === 0) {
    return res.status(400).json({
      ok: false,
      error: 'At least one ZIP code is required',
      code: 'INVALID_ZIP_CODES'
    });
  }
  
  try {
    // Check if user already has a business (limit to 1 for MVP)
    const existingBusinesses = await getUserBusinesses(userId);
    console.log(`[Onboarding] User ${userId} existing businesses:`, existingBusinesses.length);
    
    if (existingBusinesses && existingBusinesses.length > 0) {
      return res.status(400).json({
        ok: false,
        error: 'You already have a business. Multiple businesses not supported in MVP.',
        code: 'BUSINESS_LIMIT_REACHED',
        existingBusinessId: existingBusinesses[0].id
      });
    }
    
    // Generate unique slug from business name
    const baseSlug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    console.log(`[Onboarding] Generating slug from business name: "${businessName}" → "${baseSlug}"`);
    
    let slug = baseSlug;
    let slugAttempt = 0;
    let isSlugUnique = false;
    
    // Ensure slug is unique
    while (!isSlugUnique && slugAttempt < 10) {
      const { data: existing, error: slugCheckError } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', slug)
        .single();
      
      if (slugCheckError && slugCheckError.code === 'PGRST116') {
        // PGRST116 = no rows returned, slug is unique
        isSlugUnique = true;
        console.log(`[Onboarding] Slug "${slug}" is unique`);
      } else if (!existing) {
        isSlugUnique = true;
        console.log(`[Onboarding] Slug "${slug}" is unique`);
      } else {
        slugAttempt++;
        slug = `${baseSlug}-${slugAttempt}`;
        console.log(`[Onboarding] Slug exists, trying "${slug}"`);
      }
    }
    
    if (!isSlugUnique) {
      return res.status(500).json({
        ok: false,
        error: 'Failed to generate unique business URL',
        code: 'SLUG_GENERATION_FAILED'
      });
    }
    
    // Create business record
    console.log(`[Onboarding] Creating business with slug: "${slug}"`);
    
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        name: businessName.trim(),
        slug: slug,
        industry: industry,
        phone: phone,
        email: email,
        service_zip_codes: zipCodes,
        is_public: isPublic || false,
        tagline: tagline || null,
        short_description: shortDescription || null,
        is_active: true,
        onboarding_completed: true
      })
      .select()
      .single();
    
    if (businessError) {
      console.error('[Onboarding] Error creating business:', businessError);
      throw businessError;
    }
    
    console.log(`[Onboarding] Business created successfully:`, business.id);
    
    // Link user to business as owner
    console.log(`[Onboarding] Linking user ${userId} to business ${business.id}`);
    
    const { error: linkError } = await supabase
      .from('business_users')
      .insert({
        user_id: userId,
        business_id: business.id,
        role: 'owner',
        is_default: true // This is the user's default business
      });
    
    if (linkError) {
      console.error('[Onboarding] Error linking user to business:', linkError);
      // Rollback: delete the business
      await supabase.from('businesses').delete().eq('id', business.id);
      throw linkError;
    }
    
    console.log(`[Onboarding] User linked successfully as owner`);
    
    logger.info(`Business created during onboarding`, {
      businessId: business.id,
      businessName: business.name,
      slug: business.slug,
      userId,
      industry,
      zipCodes
    });
    
    res.status(201).json({
      ok: true,
      message: 'Business created successfully',
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        industry: business.industry,
        phone: business.phone,
        email: business.email,
        service_zip_codes: business.service_zip_codes,
        is_active: business.is_active,
        publicUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/b/${business.slug}`
      }
    });
  } catch (error) {
    console.error('Error creating business:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to create business',
      details: error.message
    });
  }
});

// PATCH /api/business/:businessId - Update business settings (Protected)
app.patch('/api/business/:businessId', requireAuth, requireBusinessOwnership, async (req, res) => {
  const { verifiedBusinessId, businessRole } = req.authContext;
  const { is_listed } = req.body;
  
  // SECURITY: Only owners can update business settings
  if (businessRole !== 'owner') {
    return res.status(403).json({
      ok: false,
      error: 'Only owners can update business settings',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  
  try {
    // Build update object with only allowed fields
    const updates = {};
    
    if (typeof is_listed === 'boolean') {
      updates.is_listed = is_listed;
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'No valid fields to update'
      });
    }
    
    // Update business
    const { data: business, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', verifiedBusinessId)
      .select()
      .single();
    
    if (error) {
      logger.error('Error updating business', { error: error.message, businessId: verifiedBusinessId });
      return res.status(500).json({
        ok: false,
        error: 'Failed to update business'
      });
    }
    
    logger.info('Business updated', {
      businessId: verifiedBusinessId,
      updates,
      userId: req.authContext.userId
    });
    
    res.json({
      ok: true,
      message: 'Business updated successfully',
      business: {
        id: business.id,
        slug: business.slug,
        name: business.name,
        is_listed: business.is_listed,
        is_active: business.is_active
      }
    });
  } catch (error) {
    logger.error('Error updating business', { error: error.message });
    res.status(500).json({
      ok: false,
      error: 'Failed to update business',
      details: error.message
    });
  }
});

