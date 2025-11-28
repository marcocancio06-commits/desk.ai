// ============================================================================
// APPOINTMENTS STORE - File-based appointment storage
// ============================================================================
// Simple JSON file-based storage for appointments
// TODO: Replace with database (MongoDB, PostgreSQL, etc.) in production

const fs = require('fs');
const path = require('path');

const APPOINTMENTS_FILE = path.join(__dirname, 'appointments.json');

// In-memory storage
let appointments = [];

// ============================================================================
// INITIALIZATION - Load appointments from file on startup
// ============================================================================
function loadAppointments() {
  try {
    if (fs.existsSync(APPOINTMENTS_FILE)) {
      const data = fs.readFileSync(APPOINTMENTS_FILE, 'utf8');
      appointments = JSON.parse(data);
      console.log(`✅ Loaded ${appointments.length} appointments from file`);
    } else {
      console.log('📝 No appointments file found, starting fresh');
      appointments = [];
      saveAppointments();
    }
  } catch (error) {
    console.error('❌ Error loading appointments:', error.message);
    appointments = [];
  }
}

// ============================================================================
// PERSISTENCE - Save appointments to file
// ============================================================================
function saveAppointments() {
  try {
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(appointments, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ Error saving appointments:', error.message);
  }
}

// ============================================================================
// GENERATE ID - Create unique appointment ID
// ============================================================================
function generateAppointmentId() {
  return `apt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// GET ALL APPOINTMENTS - With optional filtering
// ============================================================================
function getAppointments(filters = {}) {
  let filtered = [...appointments];
  
  // Filter by status
  if (filters.status) {
    filtered = filtered.filter(apt => apt.status === filters.status);
  }
  
  // Filter by urgency
  if (filters.urgency) {
    filtered = filtered.filter(apt => apt.urgency === filters.urgency);
  }
  
  // Sort by createdAt descending (newest first)
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return filtered;
}

// ============================================================================
// GET APPOINTMENT BY ID
// ============================================================================
function getAppointmentById(id) {
  return appointments.find(apt => apt.id === id);
}

// ============================================================================
// CREATE APPOINTMENT
// ============================================================================
function createAppointment(data) {
  const now = new Date().toISOString();
  
  // Validate required fields
  if (!data.customerPhone) {
    throw new Error('customerPhone is required');
  }
  if (!data.issueSummary) {
    throw new Error('issueSummary is required');
  }
  
  const appointment = {
    id: generateAppointmentId(),
    customerPhone: data.customerPhone,
    issueSummary: data.issueSummary,
    zipCode: data.zipCode || null,
    preferredTimeText: data.preferredTimeText || null,
    scheduledStart: data.scheduledStart || null,
    scheduledEnd: data.scheduledEnd || null,
    urgency: data.urgency || 'normal',
    status: data.status || (data.scheduledStart ? 'scheduled' : 'new'),
    sourceChannel: data.sourceChannel || 'web_chat',
    internalNotes: data.internalNotes || null,
    eventId: data.eventId || null, // For Google Calendar sync
    createdAt: now,
    updatedAt: now
  };
  
  appointments.push(appointment);
  saveAppointments();
  
  console.log(`✅ Created appointment ${appointment.id}`);
  return appointment;
}

// ============================================================================
// UPDATE APPOINTMENT
// ============================================================================
function updateAppointment(id, updates) {
  const appointment = appointments.find(apt => apt.id === id);
  
  if (!appointment) {
    throw new Error(`Appointment ${id} not found`);
  }
  
  // Allowed updates
  const allowedFields = [
    'status',
    'scheduledStart',
    'scheduledEnd',
    'internalNotes',
    'eventId'
  ];
  
  allowedFields.forEach(field => {
    if (field in updates) {
      appointment[field] = updates[field];
    }
  });
  
  appointment.updatedAt = new Date().toISOString();
  
  saveAppointments();
  
  console.log(`✅ Updated appointment ${id}`);
  return appointment;
}

// ============================================================================
// INITIALIZE ON MODULE LOAD
// ============================================================================
loadAppointments();

// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment
};
