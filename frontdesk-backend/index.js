const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();
const { handleCustomerMessage, generateDailySummary } = require('./aiClient');
const { upsertLeadFromMessage, getLeadsForBusiness, getLeadStats, getMetricsForPeriods, getAppointments: getLeadsAppointments, updateLeadFields } = require('./leadStore');
const { 
  getAppointments, 
  getAppointmentById, 
  createAppointment, 
  updateAppointment 
} = require('./appointmentsStore');
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
    timestamp: new Date().toISOString()
  });
});

// Message handling endpoint
app.post('/api/message', async (req, res) => {
  const { businessId, from, channel, message } = req.body;
  
  if (!message) {
    return res.status(400).json({ 
      error: 'Message is required' 
    });
  }
  
  try {
    const targetBusinessId = businessId || 'demo-plumbing';
    const targetFrom = from || 'unknown';
    
    // Get existing lead to retrieve conversation state
    const existingLeads = getLeadsForBusiness(targetBusinessId);
    const existingLead = existingLeads.find(l => l.phone === targetFrom);
    
    // Build conversation state from existing lead
    let conversationState = null;
    if (existingLead) {
      conversationState = {
        collected_data: {
          issue_summary: existingLead.issueSummary,
          zip_code: existingLead.zipCode,
          preferred_time: existingLead.preferredTime,
          urgency: existingLead.urgency
        }
      };
    }
    
    // Call AI with conversation state
    const aiResult = await handleCustomerMessage({
      businessId: targetBusinessId,
      from: targetFrom,
      channel: channel || 'web',
      message,
      conversationState
    });
    
    // Save or update the lead from this conversation
    const lead = upsertLeadFromMessage({
      businessId: targetBusinessId,
      channel: channel || 'web',
      from: targetFrom,
      message,
      aiResult
    });
    
    // Return AI result with lead summary
    res.status(200).json({
      ...aiResult,
      lead: {
        id: lead.id,
        status: lead.status,
        updatedAt: lead.updatedAt
      }
    });
  } catch (error) {
    console.error('Error handling message:', error);
    res.status(500).json({ 
      error: 'Failed to process message' 
    });
  }
});

// Get leads for a business
app.get('/api/leads', (req, res) => {
  const { businessId } = req.query;
  
  if (!businessId) {
    return res.status(400).json({ 
      error: 'businessId query parameter is required' 
    });
  }
  
  try {
    const leads = getLeadsForBusiness(businessId);
    const stats = getLeadStats(businessId);
    
    res.status(200).json({ 
      leads,
      stats,
      count: leads.length
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leads' 
    });
  }
});

// Get daily summary with metrics and AI-generated insights
app.get('/api/summary', async (req, res) => {
  const { businessId } = req.query;
  
  // Default to demo-plumbing if not provided
  const targetBusinessId = businessId || 'demo-plumbing';
  
  try {
    // Get metrics for today and last 7 days
    const metrics = getMetricsForPeriods(targetBusinessId);
    
    // Get appointments (qualified or scheduled leads)
    const appointments = getLeadsAppointments(targetBusinessId);
    
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
      error: 'Failed to generate summary' 
    });
  }
});

// Update a lead's fields (status, urgency, scheduledTime, ownerNotes)
// TODO: Add authentication to verify business owner permissions
app.patch('/api/leads/:id', (req, res) => {
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
    // Update the lead with provided fields
    const updatedLead = updateLeadFields({
      leadId: id,
      businessId,
      status,
      urgency,
      scheduledTime,
      ownerNotes
    });
    
    // Check if lead was found
    if (!updatedLead) {
      return res.status(404).json({ 
        error: 'Lead not found or does not belong to this business' 
      });
    }
    
    // Return the updated lead
    res.status(200).json({ 
      lead: updatedLead,
      message: 'Lead updated successfully'
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ 
      error: 'Failed to update lead' 
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
// APPOINTMENTS API - Manage jobs/appointments
// ============================================================================

// GET /api/appointments - List appointments with optional filtering
app.get('/api/appointments', (req, res) => {
  const { status, urgency } = req.query;
  
  try {
    const filters = {};
    if (status) filters.status = status;
    if (urgency) filters.urgency = urgency;
    
    const appointments = getAppointments(filters);
    
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
      error: 'Failed to fetch appointments'
    });
  }
});

// POST /api/appointments - Create new appointment with optional calendar sync
app.post('/api/appointments', async (req, res) => {
  const { 
    customerPhone, 
    issueSummary, 
    zipCode, 
    preferredTimeText,
    scheduledStart,
    scheduledEnd,
    urgency,
    sourceChannel,
    internalNotes
  } = req.body;
  
  // Validate required fields
  if (!customerPhone || !issueSummary) {
    return res.status(400).json({ 
      ok: false,
      error: 'customerPhone and issueSummary are required' 
    });
  }
  
  try {
    // Create the appointment in our system
    const appointment = createAppointment({
      customerPhone,
      issueSummary,
      zipCode,
      preferredTimeText,
      scheduledStart,
      scheduledEnd,
      urgency,
      sourceChannel,
      internalNotes
    });
    
    // Attempt to sync with Google Calendar if enabled and scheduled
    let calendarSynced = false;
    if (scheduledStart && isCalendarEnabled()) {
      try {
        const eventId = await createAppointmentEvent(appointment);
        if (eventId) {
          // Update appointment with the calendar eventId
          updateAppointment(appointment.id, { eventId });
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

// PATCH /api/appointments/:id - Update appointment with optional calendar sync
app.patch('/api/appointments/:id', async (req, res) => {
  const { id } = req.params;
  const { status, scheduledStart, scheduledEnd, internalNotes } = req.body;
  
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
    if (scheduledStart !== undefined) updates.scheduledStart = scheduledStart;
    if (scheduledEnd !== undefined) updates.scheduledEnd = scheduledEnd;
    if (internalNotes !== undefined) updates.internalNotes = internalNotes;
    
    // Update in our system
    const appointment = updateAppointment(id, updates);
    
    // Attempt to sync with Google Calendar if enabled and has eventId
    let calendarSynced = false;
    if (appointment.eventId && isCalendarEnabled()) {
      try {
        await updateAppointmentEvent(appointment);
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
    
    if (error.message.includes('not found')) {
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
  console.log(`Server running on port ${PORT}`);
});
