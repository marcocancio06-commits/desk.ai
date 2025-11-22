// ============================================================================
// GOOGLE CALENDAR OAUTH SERVICE
// ============================================================================
// Handles OAuth-based Google Calendar sync with conflict detection

const { google } = require('googleapis');
const db = require('./db');

// ============================================================================
// OAUTH CONFIGURATION
// ============================================================================
const OAUTH_CONFIG = {
  clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
  clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3001/api/google/callback'
};

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

// ============================================================================
// CREATE OAUTH CLIENT
// ============================================================================
function createOAuthClient() {
  return new google.auth.OAuth2(
    OAUTH_CONFIG.clientId,
    OAUTH_CONFIG.clientSecret,
    OAUTH_CONFIG.redirectUri
  );
}

// ============================================================================
// GENERATE AUTH URL
// ============================================================================
function getAuthUrl(businessId) {
  const oAuth2Client = createOAuthClient();
  
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: businessId, // Pass businessId in state parameter
    prompt: 'consent' // Force consent to get refresh token
  });
}

// ============================================================================
// EXCHANGE CODE FOR TOKENS
// ============================================================================
async function exchangeCodeForTokens(code) {
  const oAuth2Client = createOAuthClient();
  
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error.message);
    throw new Error('Failed to exchange authorization code');
  }
}

// ============================================================================
// SAVE TOKENS TO DATABASE
// ============================================================================
async function saveTokens(businessId, tokens) {
  try {
    // Get user's email from token info
    const oAuth2Client = createOAuthClient();
    oAuth2Client.setCredentials(tokens);
    
    const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    const tokenData = {
      businessId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenType: tokens.token_type || 'Bearer',
      expiryDate: tokens.expiry_date,
      scope: tokens.scope,
      connectedEmail: userInfo.data.email,
      isActive: true
    };
    
    await db.saveGoogleCalendarTokens(tokenData);
    
    console.log(`✅ Saved Google Calendar tokens for business: ${businessId}`);
    return tokenData;
    
  } catch (error) {
    console.error('Error saving tokens:', error.message);
    throw error;
  }
}

// ============================================================================
// GET AUTHENTICATED CLIENT
// ============================================================================
async function getAuthenticatedClient(businessId) {
  try {
    const tokens = await db.getGoogleCalendarTokens(businessId);
    
    if (!tokens || !tokens.isActive) {
      throw new Error('No active Google Calendar connection found');
    }
    
    const oAuth2Client = createOAuthClient();
    oAuth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_type: tokens.tokenType,
      expiry_date: tokens.expiryDate
    });
    
    // Auto-refresh token if expired
    oAuth2Client.on('tokens', async (newTokens) => {
      console.log('🔄 Refreshing access token...');
      await db.updateGoogleCalendarTokens(businessId, {
        accessToken: newTokens.access_token,
        expiryDate: newTokens.expiry_date
      });
    });
    
    return {
      auth: oAuth2Client,
      calendar: google.calendar({ version: 'v3', auth: oAuth2Client }),
      calendarId: tokens.calendarId || 'primary',
      email: tokens.connectedEmail
    };
    
  } catch (error) {
    console.error('Error getting authenticated client:', error.message);
    throw error;
  }
}

// ============================================================================
// DISCONNECT CALENDAR
// ============================================================================
async function disconnectCalendar(businessId) {
  try {
    await db.deactivateGoogleCalendarTokens(businessId);
    console.log(`✅ Disconnected Google Calendar for business: ${businessId}`);
    return true;
  } catch (error) {
    console.error('Error disconnecting calendar:', error.message);
    throw error;
  }
}

// ============================================================================
// PUSH APPOINTMENT TO GOOGLE CALENDAR
// ============================================================================
async function pushAppointmentToCalendar(businessId, appointment) {
  try {
    const { calendar, calendarId } = await getAuthenticatedClient(businessId);
    
    // Build event
    const event = {
      summary: `${appointment.issueSummary || 'Appointment'}`,
      description: buildEventDescription(appointment),
      start: {
        dateTime: appointment.scheduledStart,
        timeZone: 'America/Chicago'
      },
      end: {
        dateTime: appointment.scheduledEnd || appointment.scheduledStart,
        timeZone: 'America/Chicago'
      },
      colorId: getColorIdForUrgency(appointment.urgency)
    };
    
    // Create or update event
    let googleEventId = appointment.googleEventId;
    
    if (googleEventId) {
      // Update existing event
      await calendar.events.update({
        calendarId,
        eventId: googleEventId,
        resource: event
      });
      console.log(`✅ Updated Google Calendar event: ${googleEventId}`);
    } else {
      // Create new event
      const response = await calendar.events.insert({
        calendarId,
        resource: event
      });
      googleEventId = response.data.id;
      console.log(`✅ Created Google Calendar event: ${googleEventId}`);
      
      // Save mapping
      await db.createGoogleCalendarEventMapping({
        appointmentId: appointment.id,
        businessId,
        googleEventId,
        calendarId,
        syncStatus: 'synced'
      });
      
      // Update appointment with Google event ID
      await db.updateAppointment(appointment.id, { 
        googleEventId,
        lastSyncedAt: new Date()
      });
    }
    
    return googleEventId;
    
  } catch (error) {
    console.error('Error pushing appointment to calendar:', error.message);
    
    // Log sync error
    if (appointment.id) {
      await db.updateGoogleCalendarEventMapping(appointment.id, {
        syncStatus: 'error',
        syncError: error.message
      });
    }
    
    throw error;
  }
}

// ============================================================================
// PULL EVENTS FROM GOOGLE CALENDAR
// ============================================================================
async function pullEventsFromCalendar(businessId, options = {}) {
  try {
    const { calendar, calendarId } = await getAuthenticatedClient(businessId);
    
    const timeMin = options.timeMin || new Date().toISOString();
    const timeMax = options.timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    
    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250
    });
    
    const events = response.data.items || [];
    console.log(`📥 Pulled ${events.length} events from Google Calendar`);
    
    return events.map(event => ({
      googleEventId: event.id,
      summary: event.summary,
      description: event.description,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      status: event.status,
      htmlLink: event.htmlLink,
      creator: event.creator,
      organizer: event.organizer
    }));
    
  } catch (error) {
    console.error('Error pulling events from calendar:', error.message);
    throw error;
  }
}

// ============================================================================
// DETECT CONFLICTS
// ============================================================================
async function detectConflicts(businessId, appointment) {
  try {
    const { calendar, calendarId } = await getAuthenticatedClient(businessId);
    
    if (!appointment.scheduledStart) {
      return []; // No conflicts if no scheduled time
    }
    
    const appointmentStart = new Date(appointment.scheduledStart);
    const appointmentEnd = new Date(appointment.scheduledEnd || appointment.scheduledStart);
    
    // Get events in the same time range
    const response = await calendar.events.list({
      calendarId,
      timeMin: new Date(appointmentStart.getTime() - 3600000).toISOString(), // 1 hour buffer
      timeMax: new Date(appointmentEnd.getTime() + 3600000).toISOString(),
      singleEvents: true
    });
    
    const events = response.data.items || [];
    const conflicts = [];
    
    for (const event of events) {
      // Skip if this is the same event
      if (event.id === appointment.googleEventId) continue;
      
      // Skip cancelled events
      if (event.status === 'cancelled') continue;
      
      const eventStart = new Date(event.start.dateTime || event.start.date);
      const eventEnd = new Date(event.end.dateTime || event.end.date);
      
      // Check for overlap
      if (appointmentStart < eventEnd && appointmentEnd > eventStart) {
        const conflict = {
          appointmentId: appointment.id,
          businessId,
          conflictType: 'overlap',
          googleEventId: event.id,
          googleEventSummary: event.summary,
          googleEventStart: eventStart,
          googleEventEnd: eventEnd,
          conflictSeverity: 'warning',
          isResolved: false
        };
        
        conflicts.push(conflict);
        
        // Save conflict to database
        await db.createGoogleCalendarConflict(conflict);
      }
    }
    
    // Update appointment conflict status
    if (conflicts.length > 0) {
      await db.updateAppointment(appointment.id, { hasConflict: true });
    }
    
    console.log(`⚠️  Found ${conflicts.length} conflict(s) for appointment ${appointment.id}`);
    return conflicts;
    
  } catch (error) {
    console.error('Error detecting conflicts:', error.message);
    return [];
  }
}

// ============================================================================
// BIDIRECTIONAL SYNC
// ============================================================================
async function syncCalendar(businessId) {
  const startTime = Date.now();
  let eventsPushed = 0;
  let eventsPulled = 0;
  let conflictsDetected = 0;
  let errorsCount = 0;
  
  try {
    console.log(`🔄 Starting calendar sync for business: ${businessId}`);
    
    // 1. Push pending appointments to Google Calendar
    const pendingAppointments = await db.getAppointmentsNeedingSync(businessId);
    
    for (const appointment of pendingAppointments) {
      try {
        await pushAppointmentToCalendar(businessId, appointment);
        eventsPushed++;
      } catch (error) {
        console.error(`Error pushing appointment ${appointment.id}:`, error.message);
        errorsCount++;
      }
    }
    
    // 2. Pull events from Google Calendar
    const googleEvents = await pullEventsFromCalendar(businessId);
    eventsPulled = googleEvents.length;
    
    // 3. Detect conflicts for all upcoming appointments
    const upcomingAppointments = await db.getUpcomingAppointments(businessId);
    
    for (const appointment of upcomingAppointments) {
      try {
        const conflicts = await detectConflicts(businessId, appointment);
        conflictsDetected += conflicts.length;
      } catch (error) {
        console.error(`Error detecting conflicts for ${appointment.id}:`, error.message);
        errorsCount++;
      }
    }
    
    // Log sync operation
    const duration = Date.now() - startTime;
    await db.logGoogleCalendarSync({
      businessId,
      syncType: 'full',
      syncDirection: 'bidirectional',
      eventsPushed,
      eventsPulled,
      conflictsDetected,
      errorsCount,
      syncStatus: errorsCount > 0 ? 'partial' : 'success',
      durationMs: duration
    });
    
    console.log(`✅ Calendar sync complete: ${eventsPushed} pushed, ${eventsPulled} pulled, ${conflictsDetected} conflicts`);
    
    return {
      success: true,
      eventsPushed,
      eventsPulled,
      conflictsDetected,
      errorsCount,
      duration
    };
    
  } catch (error) {
    console.error('Error during calendar sync:', error.message);
    
    // Log failed sync
    await db.logGoogleCalendarSync({
      businessId,
      syncType: 'full',
      syncDirection: 'bidirectional',
      eventsPushed,
      eventsPulled,
      conflictsDetected,
      errorsCount: errorsCount + 1,
      syncStatus: 'failed',
      errorMessage: error.message,
      durationMs: Date.now() - startTime
    });
    
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function buildEventDescription(appointment) {
  const parts = [];
  
  if (appointment.issueSummary) parts.push(`Issue: ${appointment.issueSummary}`);
  if (appointment.customerPhone) parts.push(`Phone: ${appointment.customerPhone}`);
  if (appointment.zipCode) parts.push(`ZIP: ${appointment.zipCode}`);
  if (appointment.urgency) parts.push(`Urgency: ${appointment.urgency}`);
  if (appointment.status) parts.push(`Status: ${appointment.status}`);
  if (appointment.notes) parts.push(`\nNotes: ${appointment.notes}`);
  if (appointment.internalNotes) parts.push(`\nInternal: ${appointment.internalNotes}`);
  
  return parts.join('\n');
}

function getColorIdForUrgency(urgency) {
  const colorMap = {
    emergency: '11', // Red
    high: '6',       // Orange
    normal: '9',     // Blue
    low: '2'         // Green
  };
  return colorMap[urgency] || '9';
}

// ============================================================================
// CHECK CONNECTION STATUS
// ============================================================================
async function getConnectionStatus(businessId) {
  try {
    const tokens = await db.getGoogleCalendarTokens(businessId);
    
    if (!tokens || !tokens.isActive) {
      return {
        connected: false,
        email: null
      };
    }
    
    return {
      connected: true,
      email: tokens.connectedEmail,
      calendarId: tokens.calendarId,
      connectedAt: tokens.createdAt
    };
    
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
  getAuthUrl,
  exchangeCodeForTokens,
  saveTokens,
  disconnectCalendar,
  pushAppointmentToCalendar,
  pullEventsFromCalendar,
  detectConflicts,
  syncCalendar,
  getConnectionStatus
};
