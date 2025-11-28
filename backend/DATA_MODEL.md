# Desk.ai Data Model Documentation

## Overview
Desk.ai uses a relational Postgres database (Supabase or Neon) to persist all customer interactions, leads, messages, appointments, and business settings. This document describes the database schema, relationships, data flow, and API patterns.

---

## Database Architecture

### Technology Stack
- **Database**: PostgreSQL 14+ (Supabase or Neon)
- **ORM**: None (raw SQL via Supabase JS client)
- **Client Library**: `@supabase/supabase-js`
- **Migrations**: SQL files in `schema.sql`

### Design Principles
1. **Relational Integrity**: Foreign keys ensure data consistency
2. **Soft Deletions**: Use status flags instead of hard deletes (future enhancement)
3. **Timestamps**: All tables have `created_at` and `updated_at`
4. **JSONB Storage**: Flexible fields use JSONB for schema-less data
5. **Indexes**: Strategic indexes on frequently queried columns

---

## Table Schemas

### 1. `business_settings`
Stores configuration for each business using Desk.ai.

```sql
CREATE TABLE business_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id VARCHAR(100) UNIQUE NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  service_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  pricing JSONB NOT NULL DEFAULT '{}'::jsonb,
  hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  policies JSONB NOT NULL DEFAULT '{}'::jsonb,
  emergency_policy TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_business_settings_business_id` on `business_id`

**Relationships:**
- One-to-many with `leads`
- One-to-many with `appointments`

**Example Data:**
```json
{
  "business_id": "demo-business-001",
  "business_name": "Houston Home Services",
  "services": ["Plumbing", "HVAC", "Electrical"],
  "service_areas": ["77001", "77002", "77003"],
  "pricing": {
    "Trip Fee": "$89",
    "Hourly Rate": "$120-180/hr"
  },
  "hours": {
    "weekdays": "8am - 6pm",
    "saturday": "9am - 4pm",
    "sunday": "Closed"
  },
  "policies": {
    "tripFee": "Standard $89 trip fee, waived if repair booked"
  }
}
```

---

### 2. `leads`
Stores customer leads and their collected information.

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  channel VARCHAR(50) DEFAULT 'sms',
  issue_summary TEXT,
  zip_code VARCHAR(10),
  preferred_time VARCHAR(100),
  urgency VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'new',
  conversation_state VARCHAR(50) DEFAULT 'initial',
  confidence_scores JSONB DEFAULT '{}'::jsonb,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_leads_business_id` on `business_id`
- `idx_leads_phone` on `phone`
- `idx_leads_status` on `status`
- `idx_leads_urgency` on `urgency`
- `idx_leads_created_at` on `created_at DESC`
- `idx_leads_business_phone` on `(business_id, phone)`

**Relationships:**
- Many-to-one with `business_settings`
- One-to-many with `messages`
- One-to-many with `appointments`

**Field Descriptions:**
- `conversation_state`: `initial` | `collecting_info` | `qualified` | `ready_to_schedule`
- `status`: `new` | `collecting_info` | `ready_to_book` | `scheduled` | `completed` | `cancelled`
- `urgency`: `normal` | `high` | `emergency`
- `confidence_scores`: JSON object with confidence levels for each field (0.0-1.0)

**Example Data:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "business_id": "demo-business-001",
  "phone": "+17135551234",
  "channel": "sms",
  "issue_summary": "Water heater leaking in garage",
  "zip_code": "77001",
  "preferred_time": "this afternoon",
  "urgency": "emergency",
  "status": "ready_to_book",
  "conversation_state": "ready_to_schedule",
  "confidence_scores": {
    "issue": 0.95,
    "zip_code": 1.0,
    "preferred_time": 0.9,
    "urgency": 1.0
  },
  "internal_notes": "Customer has active leak, prioritize callback"
}
```

---

### 3. `messages`
Stores all conversation messages between customers and the AI.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sender VARCHAR(20) NOT NULL,
  text TEXT NOT NULL,
  ai_data JSONB,
  channel VARCHAR(50) DEFAULT 'sms',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_messages_lead_id` on `lead_id`
- `idx_messages_created_at` on `created_at DESC`
- `idx_messages_lead_created` on `(lead_id, created_at DESC)`

**Relationships:**
- Many-to-one with `leads`

**Field Descriptions:**
- `sender`: `customer` | `ai`
- `ai_data`: Stores full AI response including `booking_intent`, `collected_data`, `confidence_scores`, `internal_notes`

**Example Data:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "lead_id": "550e8400-e29b-41d4-a716-446655440000",
  "sender": "customer",
  "text": "My water heater is leaking everywhere",
  "ai_data": null,
  "channel": "sms",
  "created_at": "2025-11-22T10:30:00Z"
},
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "lead_id": "550e8400-e29b-41d4-a716-446655440000",
  "sender": "ai",
  "text": "Oh no, a leaking water heater needs immediate attention! What's your ZIP code so I can confirm we service your area?",
  "ai_data": {
    "reply": "Oh no, a leaking water heater needs immediate attention! What's your ZIP code so I can confirm we service your area?",
    "booking_intent": "collecting_info",
    "collected_data": {
      "issue_summary": "water heater leaking",
      "zip_code": null,
      "preferred_time": null,
      "urgency": "emergency"
    },
    "confidence_scores": {
      "issue": 0.95,
      "zip_code": 0,
      "preferred_time": 0,
      "urgency": 1.0
    },
    "internal_notes": "Emergency leak reported, collecting ZIP code next."
  },
  "channel": "sms",
  "created_at": "2025-11-22T10:30:02Z"
}
```

---

### 4. `appointments`
Stores scheduled service appointments.

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  business_id VARCHAR(100) NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  issue_summary TEXT,
  zip_code VARCHAR(10),
  urgency VARCHAR(20),
  customer_phone VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_appointments_business_id` on `business_id`
- `idx_appointments_lead_id` on `lead_id`
- `idx_appointments_scheduled_date` on `scheduled_date`
- `idx_appointments_status` on `status`
- `idx_appointments_business_date` on `(business_id, scheduled_date)`

**Relationships:**
- Many-to-one with `leads`
- Many-to-one with `business_settings`

**Field Descriptions:**
- `status`: `pending` | `confirmed` | `completed` | `cancelled`
- `urgency`: `normal` | `high` | `emergency`
- `notes`: Internal notes, may include Google Calendar Event ID

**Example Data:**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "lead_id": "550e8400-e29b-41d4-a716-446655440000",
  "business_id": "demo-business-001",
  "scheduled_date": "2025-11-22",
  "scheduled_time": "2:00 PM",
  "status": "pending",
  "issue_summary": "Water heater leaking in garage",
  "zip_code": "77001",
  "urgency": "emergency",
  "customer_phone": "+17135551234",
  "notes": "Customer has active leak. Google Calendar Event ID: abc123xyz"
}
```

---

## Data Flow

### 1. Customer Sends Message

```
Customer Message → POST /api/message
  ↓
1. Get or create lead (db.getOrCreateLead)
2. Save customer message (db.createMessage)
3. Get conversation history (db.getConversationHistory)
4. Call AI with context (handleCustomerMessage)
5. Save AI response message (db.createMessage)
6. Update lead with extracted data (db.updateLeadFromAIResponse)
  ↓
Return AI response to customer
```

### 2. Fetch Dashboard Metrics

```
GET /api/summary?businessId=xxx
  ↓
1. Get today's stats (db.getLeadStats with daysAgo=0)
2. Get last 7 days stats (db.getLeadStats with daysAgo=7)
3. Get pending appointments (db.getAppointmentsByBusiness)
4. Get qualified leads (db.getAllLeads with status=ready_to_book)
5. Generate AI summary (generateDailySummary)
  ↓
Return complete dashboard data
```

### 3. Create Appointment

```
POST /api/appointments
  ↓
1. Validate required fields
2. Get or create lead if needed (db.getOrCreateLead)
3. Create appointment in database (db.createAppointment)
4. Update lead status to 'scheduled' (automatic in db.createAppointment)
5. Optional: Sync to Google Calendar (createAppointmentEvent)
  ↓
Return created appointment
```

### 4. Update Lead Status

```
PATCH /api/leads/:id
  ↓
1. Validate business ownership
2. Update lead fields (db.updateLead)
3. Return updated lead
  ↓
Frontend refreshes lead list
```

---

## API Patterns

### CRUD Operations

All database operations go through the `db.js` module:

**Create:**
```javascript
const lead = await db.createLead({ businessId, phone, channel });
const message = await db.createMessage({ leadId, sender, text, aiData });
const appointment = await db.createAppointment({ leadId, businessId, ... });
```

**Read:**
```javascript
const lead = await db.getLeadById(leadId);
const leads = await db.getAllLeads(businessId, { status: 'new' });
const messages = await db.getMessagesByLead(leadId);
const appointments = await db.getAppointmentsByBusiness(businessId);
```

**Update:**
```javascript
const updated = await db.updateLead(leadId, { status: 'scheduled' });
const updated = await db.updateAppointment(appointmentId, { status: 'confirmed' });
```

**Delete:**
```javascript
await db.deleteAppointment(appointmentId);
// Leads and messages are not deleted (soft delete via status in future)
```

### Error Handling

All database functions throw errors that should be caught:

```javascript
try {
  const lead = await db.getLeadById(leadId);
} catch (error) {
  if (error.code === 'PGRST116') {
    // Not found
    return res.status(404).json({ error: 'Lead not found' });
  }
  // Other database error
  return res.status(500).json({ error: 'Database error', details: error.message });
}
```

---

## State Machine

### Lead Conversation States

```
initial
  ↓ (customer provides some info)
collecting_info
  ↓ (have issue + 1 other field with confidence > threshold)
qualified
  ↓ (all 4 fields collected: issue, ZIP, time, urgency)
ready_to_schedule
```

**Transition Logic** (in `aiClient.js`):
```javascript
function determineConversationState(collectedData, confidenceScores) {
  const hasIssue = issue_summary && confidence.issue >= 0.7;
  const hasZip = zip_code && confidence.zip_code >= 0.9;
  const hasTime = preferred_time && confidence.preferred_time >= 0.6;
  const hasUrgency = urgency !== null;
  
  if (hasIssue && hasZip && hasTime && hasUrgency) return 'ready_to_schedule';
  if (hasIssue && (hasZip || hasTime || hasUrgency)) return 'qualified';
  if (hasIssue || hasZip) return 'collecting_info';
  return 'initial';
}
```

### Lead Status Values

- `new`: Just created, no interaction yet
- `collecting_info`: Actively gathering information
- `ready_to_book`: All info collected, ready to schedule
- `scheduled`: Appointment created
- `completed`: Service completed
- `cancelled`: Lead cancelled

---

## Confidence Scoring

Each extracted field has a confidence score (0.0 - 1.0):

```json
{
  "confidence_scores": {
    "issue": 0.95,      // High confidence - clear issue statement
    "zip_code": 1.0,     // Perfect - matches 77xxx pattern
    "preferred_time": 0.7, // Medium - "afternoon" vs exact time
    "urgency": 1.0       // Perfect - emergency keyword detected
  }
}
```

**Thresholds:**
- ZIP Code: Requires ≥ 0.9 (must be accurate)
- Issue: Requires ≥ 0.7 (reasonable understanding)
- Preferred Time: Requires ≥ 0.6 (approximate is okay)
- Urgency: Any non-null value accepted

**Memory Rule:**
- If confidence ≥ threshold, AI will NOT re-ask that question
- Higher confidence data always overrides lower confidence data

---

## Database Views (Optional Future Enhancement)

### `leads_with_context`
Pre-joined view with message counts and latest message:

```sql
CREATE OR REPLACE VIEW leads_with_context AS
SELECT 
  l.*,
  COUNT(m.id) as message_count,
  MAX(m.created_at) as last_message_time
FROM leads l
LEFT JOIN messages m ON m.lead_id = l.id
GROUP BY l.id;
```

### `upcoming_appointments`
Shows appointments scheduled for today or later:

```sql
CREATE OR REPLACE VIEW upcoming_appointments AS
SELECT 
  a.*,
  l.phone as customer_phone,
  l.issue_summary as lead_issue
FROM appointments a
JOIN leads l ON l.id = a.lead_id
WHERE a.scheduled_date >= CURRENT_DATE
  AND a.status IN ('pending', 'confirmed')
ORDER BY a.scheduled_date, a.scheduled_time;
```

---

## Migration Strategy

### Initial Setup

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Copy `SUPABASE_URL` and `SUPABASE_ANON_KEY`

2. **Run Schema Migration**
   - Open Supabase SQL Editor
   - Copy contents of `schema.sql`
   - Execute SQL

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env and add SUPABASE_URL and SUPABASE_ANON_KEY
   ```

4. **Test Connection**
   ```bash
   npm run dev
   # Should see: "Database: ✅ Connected"
   ```

### Future Migrations

For schema changes, create numbered migration files:

```
migrations/
  001_initial_schema.sql
  002_add_user_preferences.sql
  003_add_payment_tracking.sql
```

---

## Performance Optimization

### Indexing Strategy

**Always Indexed:**
- Primary keys (UUID)
- Foreign keys (`lead_id`, `business_id`)
- Frequently filtered columns (`status`, `urgency`, `created_at`)

**Composite Indexes:**
- `(business_id, phone)` - Fast lead lookup
- `(business_id, scheduled_date)` - Fast appointment queries
- `(lead_id, created_at DESC)` - Fast message history

### Query Optimization

**Good:**
```javascript
// Fetch with filters at database level
const leads = await db.getAllLeads(businessId, { 
  status: 'ready_to_book',
  urgency: 'emergency',
  limit: 10 
});
```

**Bad:**
```javascript
// Fetch all then filter in JavaScript
const allLeads = await db.getAllLeads(businessId);
const filtered = allLeads
  .filter(l => l.status === 'ready_to_book')
  .filter(l => l.urgency === 'emergency')
  .slice(0, 10);
```

### Connection Pooling

Supabase automatically handles connection pooling. For high-traffic scenarios:
- Use Supabase connection pooler (PgBouncer)
- Set `pool_mode=transaction` for better concurrency
- Monitor connection count in Supabase dashboard

---

## Security

### Row Level Security (RLS)

RLS is enabled on all tables but currently allows all operations. For production:

```sql
-- Example: Restrict leads to owning business
CREATE POLICY "Users can only see own business leads" ON leads
  FOR SELECT USING (business_id = current_setting('app.business_id'));

-- Set business_id in app context:
await supabase.rpc('set_config', { 
  setting: 'app.business_id', 
  value: businessId 
});
```

### API Security

**Current State:** No authentication (demo mode)

**Production TODO:**
- Add JWT authentication
- Validate business ownership before data access
- Rate limiting on API endpoints
- Input validation and sanitization

---

## Backup and Recovery

### Supabase Automated Backups

- Supabase Pro: Daily automated backups (7-day retention)
- Point-in-time recovery available
- Manual backups via dashboard

### Manual Backup

```bash
# Export all data
pg_dump -h db.xyz.supabase.co -U postgres -d postgres > backup.sql

# Restore
psql -h db.xyz.supabase.co -U postgres -d postgres < backup.sql
```

---

## Monitoring

### Key Metrics to Track

1. **Database Performance:**
   - Query response times
   - Connection pool usage
   - Index hit ratio
   - Table sizes

2. **Business Metrics:**
   - New leads per day
   - Conversion rate (leads → scheduled)
   - Average time to schedule
   - Message volume per lead

3. **Data Quality:**
   - Confidence score distributions
   - Incomplete leads (missing required fields)
   - Stale leads (no activity > 7 days)

### Supabase Dashboard

Monitor in Supabase Dashboard:
- Database > Usage (connections, queries, storage)
- Reports > Performance (slow queries)
- Logs > Postgres logs (errors, warnings)

---

## Summary

The Desk.ai data model provides:
- ✅ **Full persistence** for all customer interactions
- ✅ **Relational integrity** with proper foreign keys
- ✅ **Conversation history** stored in messages table
- ✅ **State machine** tracking via `conversation_state` field
- ✅ **Confidence scoring** stored in JSONB
- ✅ **Flexible schema** with JSONB for evolving data needs
- ✅ **Production-ready** with indexes, triggers, and RLS support

**Next Steps:**
1. Set up Supabase project
2. Run `schema.sql` migration
3. Configure `.env` with database credentials
4. Test CRUD operations
5. Deploy and monitor
