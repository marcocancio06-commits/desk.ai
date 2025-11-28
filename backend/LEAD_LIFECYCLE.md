# Lead Lifecycle Management System

## Overview
Complete lead lifecycle tracking system with events, tags, and timeline visualization.

## Features Implemented

### 1. **Lead Timeline & Events**
Every action is automatically logged:
- ✅ Lead created
- ✅ Information collected (phone, ZIP, issue)
- ✅ Urgency detected
- ✅ Status updated
- ✅ Field edited
- ✅ Note added
- ✅ Tag added/removed
- ✅ Appointment scheduled

### 2. **Editable Lead Fields**
All fields can be edited with inline save:
- Phone number
- ZIP code
- Issue summary
- Preferred time
- Internal notes
- Status
- Tags

### 3. **Status Management**
Manual status transitions with tracking:
- `new` - Initial state
- `collecting_info` - AI gathering information
- `qualified` - Ready for scheduling
- `scheduled` - Appointment booked
- `closed_won` - Successfully closed
- `closed_lost` - Not converted

### 4. **Tags System**
Predefined tags with quick add/remove:
- `emergency` - Critical urgency
- `return_customer` - Repeat business
- `warranty` - Under warranty service
- `after_hours` - Outside business hours
- `high_priority` - Escalated priority

### 5. **Lead Detail Modal**
Beautiful full-featured interface:
- Contact information with inline editing
- Status button bar (one-click status updates)
- Tag management (add/remove chips)
- Add notes with timestamp
- Complete timeline (events + messages)
- Urgency indicator
- Quick actions

### 6. **Enhanced Leads Page**
- Status filter tabs with counts
- Tag filter bar (when tags exist)
- Refresh button with loading state
- Click any row to open detail modal
- Real-time updates after changes

---

## Database Schema

### `lead_events` Table
```sql
CREATE TABLE lead_events (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  event_type VARCHAR(50), -- created, info_collected, urgency_detected, etc.
  event_data JSONB,        -- Stores event-specific data
  description TEXT,        -- Human-readable description
  created_by VARCHAR(50),  -- system, ai, user
  created_at TIMESTAMPTZ
);
```

### `leads` Table Updates
```sql
-- Added column:
tags JSONB DEFAULT '[]'::jsonb

-- Added index:
CREATE INDEX idx_leads_tags ON leads USING GIN(tags);
```

---

## API Endpoints

### Timeline & Events
```bash
# Get full timeline (events + messages)
GET /api/leads/:id/timeline

# Get events only
GET /api/leads/:id/events
```

### Status Management
```bash
# Update status with event tracking
POST /api/leads/:id/status
Body: { "status": "qualified", "createdBy": "user" }
```

### Notes
```bash
# Add timestamped note
POST /api/leads/:id/notes
Body: { "note": "Customer called back", "createdBy": "user" }
```

### Tags
```bash
# Add tag
POST /api/leads/:id/tags
Body: { "tag": "emergency", "createdBy": "user" }

# Remove tag
DELETE /api/leads/:id/tags/:tag
Body: { "createdBy": "user" }
```

### Field Updates
```bash
# Update any field with event tracking
PUT /api/leads/:id
Body: { 
  "updates": { 
    "phone": "713-555-1234",
    "issue_summary": "Water heater leaking" 
  },
  "createdBy": "user"
}
```

---

## Database Functions (db.js)

### Event Management
```javascript
// Create timeline event
await createLeadEvent({
  leadId: '...',
  eventType: 'status_updated',
  eventData: { old_status: 'new', new_status: 'qualified' },
  description: 'Status changed from "new" to "qualified"',
  createdBy: 'user'
});

// Get all events for a lead
const events = await getLeadEvents(leadId);

// Get combined timeline (events + messages)
const timeline = await getLeadTimeline(leadId);
```

### Tag Management
```javascript
// Add tag (auto-creates event)
await addLeadTag(leadId, 'emergency', 'user');

// Remove tag (auto-creates event)
await removeLeadTag(leadId, 'emergency', 'user');
```

### Status Updates
```javascript
// Update status with automatic event logging
await updateLeadStatus(leadId, 'qualified', 'user');
```

### Notes
```javascript
// Add timestamped note with event
await addLeadNote(leadId, 'Customer prefers morning appointments', 'user');
```

### Field Updates
```javascript
// Update fields with change tracking
await updateLeadWithEvent(leadId, {
  phone: '713-555-1234',
  zip_code: '77001'
}, 'user');
// Creates events for each changed field
```

---

## Frontend Components

### LeadDetailModal.js
Beautiful modal component with:
- Header with lead ID
- Status button bar (6 statuses)
- Contact info section (editable)
- Tags section (add/remove)
- Urgency indicator
- Add note textarea
- Timeline view (events + messages)
- Auto-refresh on updates

### Usage
```javascript
import LeadDetailModal from './components/LeadDetailModal';

<LeadDetailModal
  leadId={selectedLeadId}
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  onUpdate={() => fetchLeads()} // Refresh parent data
/>
```

---

## Event Types Reference

| Event Type | Trigger | Event Data |
|------------|---------|------------|
| `created` | Lead first created | `{ phone, channel }` |
| `status_updated` | Manual status change | `{ old_status, new_status }` |
| `field_updated` | Any field edited | `{ field, old_value, new_value }` |
| `tag_added` | Tag added | `{ tag }` |
| `tag_removed` | Tag removed | `{ tag }` |
| `note_added` | Note added | `{ note }` |
| `info_collected` | AI extracts data | `{ field, value, confidence }` |
| `urgency_detected` | AI detects urgency | `{ urgency, confidence }` |
| `scheduled` | Appointment created | `{ date, time }` |

---

## Timeline Display

Events and messages are combined and sorted chronologically:

```javascript
[
  {
    type: 'event',
    event_type: 'created',
    description: 'Lead created from sms',
    created_by: 'system',
    created_at: '2025-11-22T10:30:00Z'
  },
  {
    type: 'message',
    sender: 'customer',
    text: 'My water heater is leaking',
    created_at: '2025-11-22T10:31:00Z'
  },
  {
    type: 'event',
    event_type: 'urgency_detected',
    description: 'Urgency level set to emergency',
    created_by: 'ai',
    created_at: '2025-11-22T10:31:15Z'
  }
]
```

---

## Setup Instructions

### 1. Run Database Migration
Execute the updated `schema.sql` in your Supabase SQL editor:
- Creates `lead_events` table
- Adds `tags` column to `leads`
- Adds GIN index on tags
- Creates timeline views

### 2. Backend Already Updated
All backend code is ready:
- Database functions in `db.js`
- API routes in `index.js`

### 3. Frontend Already Updated
- `LeadDetailModal.js` component created
- `leads.js` page updated with modal integration
- `lucide-react` package installed

### 4. Test the System
1. Go to `/dashboard/leads`
2. Click any lead row
3. Modal opens with full lead details
4. Try:
   - Changing status
   - Adding/removing tags
   - Editing fields
   - Adding notes
   - Viewing timeline

---

## Benefits

### For Business Owners
- **Complete visibility** - See every action on every lead
- **Quick actions** - Change status, add tags, edit info in one place
- **Customer context** - Full conversation + notes + timeline
- **Priority management** - Tag urgent leads, filter by tags

### For Developers
- **Audit trail** - Every change is logged
- **Event sourcing** - Rebuild state from events
- **Extensible** - Easy to add new event types
- **Database-driven** - All data persisted, survives restarts

### For AI System
- **Learning data** - Event patterns for ML models
- **Context** - Full history for better responses
- **Automation** - Auto-tag based on patterns
- **Analytics** - Conversion funnels, time-to-close

---

## Future Enhancements

### Potential Additions
- [ ] Lead score calculation based on events
- [ ] Email notifications on status changes
- [ ] Bulk actions (tag multiple leads)
- [ ] Advanced filters (date ranges, multiple tags)
- [ ] Export timeline to PDF
- [ ] Webhook triggers on events
- [ ] Custom tags (business-defined)
- [ ] Lead assignment to team members
- [ ] SLA tracking (time in each status)
- [ ] Automated status transitions

---

## Commit Summary

**Commit**: `91af671`
**Files Changed**: 7 files
**Lines Added**: +980
**Lines Removed**: -57

### Changes
1. **Database Schema** (`schema.sql`)
   - Added `lead_events` table with indexes
   - Added `tags` column to `leads` table
   - Added GIN index on tags
   - Created `lead_timeline` view

2. **Database Layer** (`db.js`)
   - +207 lines of new functions
   - Event CRUD operations
   - Tag management
   - Enhanced update functions with event tracking

3. **API Routes** (`index.js`)
   - +148 lines of new endpoints
   - Timeline retrieval
   - Status/tag/note management
   - Field updates with tracking

4. **Frontend Component** (`LeadDetailModal.js`)
   - +457 lines brand new component
   - Beautiful modal UI
   - Inline editing
   - Timeline visualization

5. **Leads Page** (`leads.js`)
   - +164 lines updated
   - Tag filtering
   - Modal integration
   - Refresh functionality

6. **Dependencies** (`package.json`)
   - Added `lucide-react` for icons

---

## Testing Checklist

- [x] Schema migration applied
- [x] Create lead → event logged
- [x] Update status → event logged
- [x] Add tag → event logged + tag appears
- [x] Remove tag → event logged + tag removed
- [x] Edit field → event logged
- [x] Add note → event logged + note saved
- [x] Timeline shows all events
- [x] Tag filter works
- [x] Modal opens/closes
- [x] Refresh updates data
- [x] All changes committed
- [x] Pushed to GitHub

**Status**: ✅ Complete and Production Ready
