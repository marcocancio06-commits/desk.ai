# APPOINTMENT SCHEDULING SYSTEM

## Overview
Complete appointment/job scheduling system with optional Google Calendar integration for Desk.ai. Business owners can schedule jobs directly from qualified leads in the demo chat, manage appointments in the dashboard, and optionally sync to Google Calendar.

## Architecture

### Backend (3 new files)

#### 1. `appointmentsStore.js` - Data Layer
- **Purpose**: File-based JSON storage for appointments
- **Storage**: `appointments.json` (auto-created)
- **Schema**:
  ```javascript
  {
    id: "apt-1234567890-abc123",
    customerPhone: "+1-555-123-4567",
    issueSummary: "Water heater leaking",
    zipCode: "77001",
    preferredTimeText: "this afternoon",
    scheduledStart: "2025-11-18T14:00:00.000Z",
    scheduledEnd: "2025-11-18T15:30:00.000Z",
    urgency: "emergency" | "high" | "normal" | "none",
    status: "new" | "scheduled" | "completed" | "cancelled",
    sourceChannel: "web_chat" | "sms" | etc,
    internalNotes: "Customer called, very urgent",
    eventId: "google-calendar-event-id", // for sync
    createdAt: "2025-11-18T12:00:00.000Z",
    updatedAt: "2025-11-18T12:00:00.000Z"
  }
  ```
- **Functions**:
  - `getAppointments(filters)` - Get all appointments with optional status/urgency filtering
  - `getAppointmentById(id)` - Get single appointment
  - `createAppointment(data)` - Create new appointment
  - `updateAppointment(id, updates)` - Update existing appointment

#### 2. `calendarClient.js` - Google Calendar Integration
- **Purpose**: Optional Google Calendar sync (env-driven)
- **Behavior**:
  - If `GOOGLE_CALENDAR_ENABLED !== "true"`: All functions are no-ops, safe to run
  - If enabled: Uses service account JWT authentication
- **Functions**:
  - `createAppointmentEvent(appointment)` - Creates Google Calendar event, returns eventId
  - `updateAppointmentEvent(appointment)` - Updates existing event
  - `deleteAppointmentEvent(eventId)` - Deletes event (for cancellations)
  - `isEnabled()` - Returns true if calendar sync is active
- **Error Handling**: Logs errors but never fails appointment operations

#### 3. API Routes in `index.js`
- **GET /api/appointments**
  - Query params: `status`, `urgency` (optional)
  - Returns: `{ ok: true, data: [...], count: N, calendarEnabled: true/false }`
  
- **POST /api/appointments**
  - Body: `{ customerPhone, issueSummary, zipCode, preferredTimeText, scheduledStart, scheduledEnd, urgency, internalNotes }`
  - Returns: `{ ok: true, data: {...}, calendarSynced: true/false, message: "..." }`
  - Behavior: Creates appointment + optional calendar sync
  
- **PATCH /api/appointments/:id**
  - Body: `{ status?, scheduledStart?, scheduledEnd?, internalNotes? }`
  - Returns: `{ ok: true, data: {...}, calendarSynced: true/false, message: "..." }`
  - Behavior: Updates appointment + syncs calendar if eventId exists

### Frontend (2 files modified, 1 created)

#### 1. `ScheduleAppointmentModal.js` - New Component
- **Location**: `frontend/components/demo/ScheduleAppointmentModal.js`
- **Props**:
  - `isOpen` - Control visibility
  - `onClose` - Close handler
  - `defaultData` - Pre-filled customer data from AI
  - `onSuccess(appointment)` - Success callback
- **Features**:
  - Displays readonly customer info (phone, issue, ZIP, urgency)
  - Date/time picker for scheduling
  - Duration selector (30min - 4hrs)
  - Internal notes field
  - Honest copy: "This adds the job to your appointments list"
  - Shows success state before auto-closing
- **Form Validation**: Requires date and time

#### 2. `demo-chat.js` - Updated
- **New Feature**: "Schedule Job" card when `booking_intent === 'ready_to_book'`
- **Behavior**:
  - Shows green success card with checkmark
  - "Schedule this job" button opens ScheduleAppointmentModal
  - Passes all collected data (phone, issue, ZIP, time, urgency) to modal
  - Success callback logs appointment creation
- **No Breaking Changes**: All existing functionality preserved

#### 3. `dashboard/calendar.js` - Complete Replacement
- **Old**: Placeholder component
- **New**: Full appointment management interface
- **Features**:
  - Filter tabs: All / New / Scheduled / Completed / Cancelled
  - Real-time counts per status
  - Table with sortable appointments
  - Displays: Customer info, scheduled time, urgency, status
  - Status update dropdown (updates via PATCH API)
  - "Synced to calendar" indicator for appointments with eventId
  - Empty states with helpful messages
  - Info box explaining appointment behavior
- **Auto-refresh**: Fetches on mount, updates after status changes

## Environment Configuration

### New Variables in `.env.example`

```bash
# Google Calendar Integration (OPTIONAL)
GOOGLE_CALENDAR_ENABLED=false              # Set to "true" to enable
GOOGLE_CALENDAR_ID=primary                 # Or specific calendar ID
GOOGLE_CLIENT_EMAIL=service@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Setup Instructions (for Google Calendar sync)

1. **Create Google Cloud Project**
   - Go to https://console.cloud.google.com/
   - Create new project or select existing

2. **Enable Google Calendar API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

3. **Create Service Account**
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Name it (e.g., "desk-ai-calendar")
   - Grant it "Service Account User" role
   - Click "Done"

4. **Generate Key File**
   - Click on the service account email
   - Go to "Keys" tab
   - "Add Key" > "Create new key" > JSON
   - Download the JSON file

5. **Share Calendar**
   - Open Google Calendar (calendar.google.com)
   - Settings > Select calendar
   - "Share with specific people"
   - Add service account email
   - Give "Make changes to events" permission

6. **Update .env**
   ```bash
   GOOGLE_CALENDAR_ENABLED=true
   GOOGLE_CALENDAR_ID=primary  # or specific calendar ID
   GOOGLE_CLIENT_EMAIL=<copy from JSON file>
   GOOGLE_PRIVATE_KEY="<copy from JSON file, replace newlines with \n>"
   ```

7. **Restart Backend**
   ```bash
   cd frontdesk-backend
   npm start
   ```

## User Flow

### 1. Demo Chat (Customer-facing)
```
Customer: "My water heater is leaking"
AI: Collects issue, ZIP, time preference, urgency
AI: booking_intent → "ready_to_book"
→ Green "Schedule this job" card appears
→ Business owner clicks "Schedule this job"
```

### 2. Schedule Modal
```
→ Modal opens with pre-filled customer data (readonly)
→ Owner selects date, time, duration
→ Optional: Adds internal notes
→ Clicks "Schedule Job"
→ POST /api/appointments
→ If GOOGLE_CALENDAR_ENABLED=true: Creates calendar event
→ Success! Shows confirmation for 2 seconds
→ Auto-closes
```

### 3. Dashboard (Owner-facing)
```
→ Navigate to Dashboard > Calendar
→ See all appointments in filterable table
→ Filter by status (All/New/Scheduled/Completed/Cancelled)
→ Update status via dropdown
→ PATCH /api/appointments/:id
→ If eventId exists: Updates Google Calendar too
→ See "Synced to calendar" indicator
```

## API Examples

### Create Appointment
```bash
curl -X POST http://localhost:3001/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "customerPhone": "+1-555-123-4567",
    "issueSummary": "Water heater leaking",
    "zipCode": "77001",
    "preferredTimeText": "this afternoon",
    "scheduledStart": "2025-11-18T14:00:00.000Z",
    "scheduledEnd": "2025-11-18T15:30:00.000Z",
    "urgency": "emergency",
    "internalNotes": "Customer needs urgent help"
  }'
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "apt-1234567890-abc123",
    "customerPhone": "+1-555-123-4567",
    "issueSummary": "Water heater leaking",
    "zipCode": "77001",
    "scheduledStart": "2025-11-18T14:00:00.000Z",
    "scheduledEnd": "2025-11-18T15:30:00.000Z",
    "urgency": "emergency",
    "status": "scheduled",
    "eventId": "abc123xyz456",
    "createdAt": "2025-11-18T12:00:00.000Z",
    "updatedAt": "2025-11-18T12:00:00.000Z"
  },
  "calendarSynced": true,
  "message": "Appointment created and synced to Google Calendar"
}
```

### Get All Appointments
```bash
curl http://localhost:3001/api/appointments
```

### Get Filtered Appointments
```bash
curl "http://localhost:3001/api/appointments?status=scheduled&urgency=emergency"
```

### Update Appointment Status
```bash
curl -X PATCH http://localhost:3001/api/appointments/apt-1234567890-abc123 \
  -H "Content-Type: application/json" \
  -d '{ "status": "completed" }'
```

## File Structure

```
frontdesk-backend/
├── appointmentsStore.js      # NEW: Appointment data layer
├── calendarClient.js          # NEW: Google Calendar integration
├── index.js                   # MODIFIED: Added 3 API routes
├── package.json              # MODIFIED: Added googleapis dependency
├── .env.example              # MODIFIED: Added calendar config
└── appointments.json         # AUTO-CREATED: Data storage

frontend/
├── components/demo/
│   └── ScheduleAppointmentModal.js  # NEW: Scheduling modal
├── pages/
│   ├── demo-chat.js          # MODIFIED: Added schedule button
│   └── dashboard/
│       └── calendar.js       # REPLACED: Now shows appointments
```

## Dependencies Added

```json
{
  "googleapis": "^131.0.0"
}
```

## Testing

### 1. Test Appointment Creation (no calendar)
```bash
cd /Users/marco/Desktop/agency-mvp/frontdesk-backend
# Ensure GOOGLE_CALENDAR_ENABLED=false in .env
npm start

# In another terminal:
curl -X POST http://localhost:3001/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "customerPhone": "+1-555-111-2222",
    "issueSummary": "Test job",
    "scheduledStart": "2025-12-01T10:00:00.000Z",
    "scheduledEnd": "2025-12-01T12:00:00.000Z"
  }'

# Check appointments.json was created
cat appointments.json
```

### 2. Test Frontend Flow
```bash
# Backend running on :3001
cd /Users/marco/Desktop/agency-mvp/frontend
npm run dev  # Will use :3002 if :3000/:3001 busy

# Open browser:
# 1. http://localhost:3002/demo-chat
# 2. Enter phone: +1-555-123-4567
# 3. Chat until ready_to_book
# 4. Click "Schedule this job"
# 5. Fill date/time, click "Schedule Job"
# 6. Navigate to http://localhost:3002/dashboard/calendar
# 7. See appointment in table
# 8. Update status via dropdown
```

### 3. Test Calendar Sync (optional)
```bash
# Set up Google Calendar as per instructions above
# Update .env:
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_CALENDAR_ID=primary
GOOGLE_CLIENT_EMAIL=your-service@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n"

# Restart backend
npm start

# Look for:
# ✅ Google Calendar client initialized

# Create appointment with schedule
curl -X POST http://localhost:3001/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "customerPhone": "+1-555-999-8888",
    "issueSummary": "Calendar sync test",
    "scheduledStart": "2025-12-01T14:00:00.000Z",
    "scheduledEnd": "2025-12-01T16:00:00.000Z"
  }'

# Check response has "calendarSynced": true and eventId
# Check Google Calendar for new event
```

## Honest Copy Principles

All UI copy follows honest communication:

### ❌ What We DON'T Say
- "We'll send the customer a confirmation SMS"
- "Customer will receive an email"
- "Automatic reminders enabled"

### ✅ What We DO Say
- "This adds the job to your appointments list"
- "You'll need to contact the customer separately to confirm"
- "Appointments are created when customers are ready to book"
- "Synced to Google Calendar" (only if actually synced)

## Safety Features

### 1. Calendar Sync is Optional
- Default: `GOOGLE_CALENDAR_ENABLED=false`
- Safe for development and testing
- No credentials needed if disabled
- All calendar functions are no-ops when disabled

### 2. Graceful Degradation
- If calendar sync fails: Logs error, continues with appointment creation
- If credentials missing: Logs warning, disables sync
- If API limit hit: Logs error, local appointment still saved

### 3. No Breaking Changes
- All existing functionality preserved
- Demo chat works with or without scheduling
- Leads system untouched
- Bug reporting still works

### 4. Data Validation
- Required fields: `customerPhone`, `issueSummary`
- ISO datetime validation for scheduled times
- Status enum validation
- Urgency enum validation

## Future Enhancements

### Potential Additions
1. **SMS notifications** (with Twilio)
2. **Email confirmations** (with SendGrid/Nodemailer)
3. **Recurring appointments**
4. **Appointment reminders** (24hr before)
5. **Customer self-scheduling** (public booking page)
6. **Multi-business support** (separate calendars per business)
7. **Technician assignment** (assign jobs to team members)
8. **Route optimization** (order jobs by location)
9. **Job completion photos** (upload before/after)
10. **Invoice generation** (from completed jobs)

### NOT Implemented (Yet)
- Customer notifications (would be misleading without real implementation)
- Payment processing
- Service history tracking
- Review collection
- Route planning

## Console Logging

### appointmentsStore.js
```
✅ Loaded 5 appointments from file
📝 No appointments file found, starting fresh
✅ Created appointment apt-1234567890-abc123
✅ Updated appointment apt-1234567890-abc123
❌ Error loading appointments: [error]
```

### calendarClient.js
```
📅 Google Calendar sync is DISABLED (GOOGLE_CALENDAR_ENABLED !== "true")
✅ Google Calendar client initialized
⚠️  Calendar client not initialized, cannot create event
✅ Created Google Calendar event: abc123xyz456
✅ Updated Google Calendar event: abc123xyz456
❌ Failed to create Google Calendar event: [error]
```

## Troubleshooting

### "Cannot read property 'events' of null"
→ Calendar client not initialized. Check GOOGLE_CALENDAR_ENABLED and credentials.

### "Invalid grant" when syncing
→ Service account key expired or incorrect. Generate new key.

### "Calendar not found"
→ Service account doesn't have access. Share calendar with service account email.

### Appointments not showing in dashboard
→ Check backend is running on :3001. Check frontend config.js BACKEND_URL.

### "No appointments file found"
→ Normal on first run. File will be created on first appointment.

## Commit Message

When committing these changes:

```
git add .
git commit -m "Add appointments scheduling and optional Google Calendar sync

APPOINTMENTS BACKEND:
- appointmentsStore.js with file-based JSON storage
- GET /api/appointments with status/urgency filtering
- POST /api/appointments with calendar sync
- PATCH /api/appointments/:id for updates
- Auto-determines status based on scheduledStart

GOOGLE CALENDAR INTEGRATION:
- calendarClient.js with env-driven sync
- Service account JWT authentication
- createAppointmentEvent and updateAppointmentEvent
- Graceful fallback if sync disabled or fails
- GOOGLE_CALENDAR_ENABLED flag for safety

FRONTEND SCHEDULING:
- ScheduleAppointmentModal for job scheduling
- 'Schedule job' card in demo-chat when ready_to_book
- Complete appointments list in dashboard/calendar
- Status updates with API integration
- Calendar sync indicator

Honest copy throughout - no fake SMS/email promises
All existing functionality preserved
Fully backward compatible
Safe for dev with calendar sync disabled by default"
```

---

**Created**: November 2025  
**Status**: Complete and tested  
**Breaking Changes**: None  
**Dependencies Added**: googleapis@^131.0.0
