// ============================================================================
// GOOGLE CALENDAR CLIENT - Optional calendar sync (env-driven)
// ============================================================================
// This module provides optional Google Calendar integration using a service account.
// If GOOGLE_CALENDAR_ENABLED !== "true", all functions are no-ops that only log.

const { google } = require('googleapis');

// ============================================================================
// CONFIGURATION - Read from environment variables
// ============================================================================
const CALENDAR_ENABLED = process.env.GOOGLE_CALENDAR_ENABLED === 'true';
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// ============================================================================
// INITIALIZE CLIENT - Only if calendar is enabled
// ============================================================================
let calendarClient = null;

function initializeCalendar() {
  if (!CALENDAR_ENABLED) {
    console.log('📅 Google Calendar sync is DISABLED (GOOGLE_CALENDAR_ENABLED !== "true")');
    return null;
  }
  
  if (!CLIENT_EMAIL || !PRIVATE_KEY) {
    console.warn('⚠️  Google Calendar is enabled but credentials are missing');
    console.warn('    Set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY in .env');
    return null;
  }
  
  try {
    const auth = new google.auth.JWT({
      email: CLIENT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });
    
    calendarClient = google.calendar({ version: 'v3', auth });
    console.log('✅ Google Calendar client initialized');
    return calendarClient;
    
  } catch (error) {
    console.error('❌ Failed to initialize Google Calendar:', error.message);
    return null;
  }
}

// Initialize on module load
calendarClient = initializeCalendar();

// ============================================================================
// CREATE APPOINTMENT EVENT - Add appointment to Google Calendar
// ============================================================================
async function createAppointmentEvent(appointment) {
  // If calendar is not enabled, just log and return
  if (!CALENDAR_ENABLED) {
    console.log('📅 Calendar sync disabled, skipping event creation');
    return null;
  }
  
  if (!calendarClient) {
    console.warn('⚠️  Calendar client not initialized, cannot create event');
    return null;
  }
  
  if (!appointment.scheduledStart) {
    console.log('⚠️  No scheduledStart provided, skipping calendar event');
    return null;
  }
  
  try {
    // Build event description
    const description = [
      `Issue: ${appointment.issueSummary}`,
      `Phone: ${appointment.customerPhone}`,
      `ZIP: ${appointment.zipCode || 'N/A'}`,
      `Urgency: ${appointment.urgency}`,
      appointment.preferredTimeText ? `Customer requested: ${appointment.preferredTimeText}` : '',
      appointment.internalNotes ? `\nNotes: ${appointment.internalNotes}` : ''
    ].filter(Boolean).join('\n');
    
    // Create the event
    const event = {
      summary: `Job: ${appointment.issueSummary}`,
      description: description,
      start: {
        dateTime: appointment.scheduledStart,
        timeZone: 'America/Chicago' // TODO: Make configurable
      },
      end: {
        dateTime: appointment.scheduledEnd || appointment.scheduledStart,
        timeZone: 'America/Chicago'
      },
      colorId: appointment.urgency === 'emergency' ? '11' : // Red for emergencies
                appointment.urgency === 'high' ? '6' : // Orange for high
                '9' // Blue for normal
    };
    
    const response = await calendarClient.events.insert({
      calendarId: CALENDAR_ID,
      resource: event
    });
    
    const eventId = response.data.id;
    console.log(`✅ Created Google Calendar event: ${eventId}`);
    
    return eventId;
    
  } catch (error) {
    console.error('❌ Failed to create Google Calendar event:', error.message);
    throw error; // Let the caller handle this
  }
}

// ============================================================================
// UPDATE APPOINTMENT EVENT - Update existing calendar event
// ============================================================================
async function updateAppointmentEvent(appointment) {
  // If calendar is not enabled, just log and return
  if (!CALENDAR_ENABLED) {
    console.log('📅 Calendar sync disabled, skipping event update');
    return null;
  }
  
  if (!calendarClient) {
    console.warn('⚠️  Calendar client not initialized, cannot update event');
    return null;
  }
  
  if (!appointment.eventId) {
    console.log('⚠️  No eventId on appointment, cannot update calendar event');
    return null;
  }
  
  try {
    // Build updated event description
    const description = [
      `Issue: ${appointment.issueSummary}`,
      `Phone: ${appointment.customerPhone}`,
      `ZIP: ${appointment.zipCode || 'N/A'}`,
      `Urgency: ${appointment.urgency}`,
      `Status: ${appointment.status}`,
      appointment.preferredTimeText ? `Customer requested: ${appointment.preferredTimeText}` : '',
      appointment.internalNotes ? `\nNotes: ${appointment.internalNotes}` : ''
    ].filter(Boolean).join('\n');
    
    const event = {
      summary: `Job: ${appointment.issueSummary}`,
      description: description
    };
    
    // Add times if scheduled
    if (appointment.scheduledStart) {
      event.start = {
        dateTime: appointment.scheduledStart,
        timeZone: 'America/Chicago'
      };
      event.end = {
        dateTime: appointment.scheduledEnd || appointment.scheduledStart,
        timeZone: 'America/Chicago'
      };
    }
    
    // Update color based on status and urgency
    if (appointment.status === 'completed') {
      event.colorId = '2'; // Green for completed
    } else if (appointment.status === 'cancelled') {
      event.colorId = '8'; // Gray for cancelled
    } else {
      event.colorId = appointment.urgency === 'emergency' ? '11' : 
                      appointment.urgency === 'high' ? '6' : '9';
    }
    
    await calendarClient.events.patch({
      calendarId: CALENDAR_ID,
      eventId: appointment.eventId,
      resource: event
    });
    
    console.log(`✅ Updated Google Calendar event: ${appointment.eventId}`);
    return appointment.eventId;
    
  } catch (error) {
    console.error('❌ Failed to update Google Calendar event:', error.message);
    throw error;
  }
}

// ============================================================================
// DELETE APPOINTMENT EVENT - Remove from calendar (optional, for cancellations)
// ============================================================================
async function deleteAppointmentEvent(eventId) {
  if (!CALENDAR_ENABLED || !calendarClient || !eventId) {
    return null;
  }
  
  try {
    await calendarClient.events.delete({
      calendarId: CALENDAR_ID,
      eventId: eventId
    });
    
    console.log(`✅ Deleted Google Calendar event: ${eventId}`);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to delete Google Calendar event:', error.message);
    return false;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
  createAppointmentEvent,
  updateAppointmentEvent,
  deleteAppointmentEvent,
  isEnabled: () => CALENDAR_ENABLED && calendarClient !== null
};
