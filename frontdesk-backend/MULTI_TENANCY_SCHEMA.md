# Multi-Tenancy Database Schema

## Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         MULTI-TENANT SCHEMA                                   │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│   auth.users        │  (Supabase Auth - managed by Supabase)
│─────────────────────│
│ id (PK)             │
│ email               │
│ encrypted_password  │
│ ...                 │
└──────────┬──────────┘
           │
           │ 1:1
           │
           ▼
┌─────────────────────┐
│   profiles          │  (User profiles)
│─────────────────────│
│ id (PK, FK)         │◄─────────┐
│ full_name           │          │
│ avatar_url          │          │
│ phone               │          │
│ role (global)       │          │
│ preferences (JSONB) │          │
└──────────┬──────────┘          │
           │                      │
           │ M:N via              │
           │ business_users       │
           │                      │
           ▼                      │
┌─────────────────────┐          │
│  business_users     │          │ M
│─────────────────────│          │
│ business_id (PK,FK) │──────┐   │
│ user_id (PK,FK)     │──────┼───┘
│ role (in business)  │      │
│ is_default          │      │
│ permissions (JSONB) │      │
└─────────────────────┘      │
                              │
                              │ M
                              │
                              ▼
                    ┌─────────────────────┐
                    │   businesses        │  (Core business entities)
                    │─────────────────────│
                    │ id (PK)             │
                    │ slug (UNIQUE) ───────────► Used in public URLs: /b/slug
                    │ name                │
                    │ phone               │
                    │ email               │
                    │ service_zip_codes   │
                    │ industry            │
                    │ services (JSONB)    │
                    │ pricing (JSONB)     │
                    │ hours (JSONB)       │
                    │ policies (JSONB)    │
                    │ is_active           │
                    │ subscription_tier   │
                    └──────────┬──────────┘
                               │
                               │ 1:M
                               │
           ┌───────────────────┴───────────────────┐
           │                                       │
           ▼                                       ▼
┌─────────────────────┐              ┌─────────────────────┐
│      leads          │              │   appointments      │
│─────────────────────│              │─────────────────────│
│ id (PK)             │              │ id (PK)             │
│ business_id (FK) ───┼──────┐       │ business_id (FK) ───┼──► All data isolated
│ phone               │      │       │ lead_id (FK)        │    by business_id
│ issue_summary       │      │       │ scheduled_date      │
│ zip_code            │      │       │ scheduled_time      │
│ status              │      │       │ status              │
│ urgency             │      │       │ notes               │
│ sms_enabled         │      │       └─────────────────────┘
│ last_sms_at         │      │
│ tags (JSONB)        │      │
└──────────┬──────────┘      │
           │                  │
           │ 1:M              │
           │                  │
           ▼                  │
┌─────────────────────┐      │
│     messages        │      │
│─────────────────────│      │
│ id (PK)             │      │
│ lead_id (FK)        │◄─────┘
│ sender              │
│ text                │
│ twilio_sid          │
│ direction           │
│ from_number         │
│ to_number           │
│ status              │
└─────────────────────┘


┌─────────────────────┐
│   lead_events       │  (Activity timeline)
│─────────────────────│
│ id (PK)             │
│ lead_id (FK)        │
│ event_type          │
│ event_data (JSONB)  │
│ description         │
│ created_by          │
└─────────────────────┘
```

## Data Flow Examples

### Example 1: Single User, Single Business (Simple Case)

```
User: john@example.com
  │
  ├─► Profile: John Doe
  │     └─► Business User: owner @ Houston Premier Plumbing
  │           │
  │           └─► Business: demo-plumbing
  │                 ├─► 15 leads
  │                 ├─► 8 appointments
  │                 └─► 45 messages
  │
  └─► Dashboard shows: demo-plumbing data only
```

### Example 2: Single User, Multiple Businesses (Franchise Owner)

```
User: sarah@example.com
  │
  ├─► Profile: Sarah Johnson
  │     ├─► Business User: owner @ Houston HVAC
  │     │     └─► Business: houston-hvac (slug)
  │     │           ├─► 32 leads
  │     │           └─► 18 appointments
  │     │
  │     └─► Business User: owner @ Austin HVAC
  │           └─► Business: austin-hvac (slug)
  │                 ├─► 28 leads
  │                 └─► 15 appointments
  │
  └─► Dashboard: Select which business to view
        OR set "is_default" to auto-select one
```

### Example 3: Multiple Users, Single Business (Team)

```
Business: demo-plumbing
  ├─► Owner: mike@plumbing.com (role: owner)
  │     └─► Can: view/edit business settings, manage team, view all leads
  │
  ├─► Manager: lisa@plumbing.com (role: manager)
  │     └─► Can: view/edit leads, manage appointments, limited settings
  │
  └─► Staff: tech1@plumbing.com (role: staff)
        └─► Can: view assigned leads, update job status, view schedule
```

## Public URLs by Business

Each business gets a unique public-facing URL based on their `slug`:

```
https://desk.ai/b/demo-plumbing        → Houston Premier Plumbing
https://desk.ai/b/houston-hvac-pro     → Houston HVAC Pro
https://desk.ai/b/austin-electrical    → Austin Electrical Services
https://desk.ai/b/dallas-appliance     → Dallas Appliance Repair
```

When a customer visits `/b/demo-plumbing`:
1. Look up business by slug `demo-plumbing`
2. Load business settings (name, services, hours, etc.)
3. Show branded chat interface for THAT business
4. Create leads with `business_id` set to that business's UUID
5. AI responds using that business's context

## Query Patterns

### Get all leads for a specific business
```sql
SELECT * FROM leads 
WHERE business_id = '00000000-0000-0000-0000-000000000001';
```

### Get all businesses a user belongs to
```sql
SELECT b.*, bu.role, bu.is_default
FROM businesses b
JOIN business_users bu ON bu.business_id = b.id
WHERE bu.user_id = 'user-uuid-here';
```

### Get business by public slug
```sql
SELECT * FROM businesses 
WHERE slug = 'demo-plumbing' 
AND is_active = true;
```

### Check if user has access to a business
```sql
SELECT EXISTS (
  SELECT 1 FROM business_users
  WHERE business_id = 'business-uuid'
  AND user_id = 'user-uuid'
) as has_access;
```

### Get lead count by business
```sql
SELECT 
  b.name,
  b.slug,
  COUNT(l.id) as lead_count
FROM businesses b
LEFT JOIN leads l ON l.business_id = b.id
GROUP BY b.id;
```

## Row Level Security (RLS) in Action

### Scenario: User tries to view leads

```sql
-- User sarah@example.com tries to query leads
SELECT * FROM leads;

-- What actually happens:
SELECT * FROM leads
WHERE business_id IN (
  SELECT business_id FROM business_users 
  WHERE user_id = auth.uid()  -- sarah's user UUID
);

-- Result: Only sees leads from businesses she belongs to
```

### Scenario: Public customer visits /b/demo-plumbing

```sql
-- Anonymous user (not logged in) creates a lead
INSERT INTO leads (business_id, phone, issue_summary)
VALUES ('00000000-0000-0000-0000-000000000001', '+15551234567', 'Leak');

-- RLS policy: Public can insert to businesses.id (chat widget)
-- But cannot SELECT other businesses' leads
```

## Migration Strategy for Existing Data

### Before Migration:
```
leads.business_id (VARCHAR): "demo-business-001"
                              ^^^^ String identifier
```

### After Migration:
```
leads.business_id_old (VARCHAR): "demo-business-001" (preserved)
leads.business_id (UUID):        00000000-0000-0000-0000-000000000001
                                  ^^^^ Proper foreign key to businesses table
```

### Cleanup After Verification:
```sql
-- Once you verify migration worked, drop old columns
ALTER TABLE leads DROP COLUMN business_id_old;
ALTER TABLE appointments DROP COLUMN business_id_old;
```

## Security Model

### Access Levels

**Super Admin** (global)
- Can view/edit any business
- Can create new businesses
- Can manage all users
- Future: admin dashboard

**Business Owner**
- Full access to their business(es)
- Can invite team members
- Can edit business settings
- Can view all leads/appointments

**Business Manager**
- Can view/edit leads/appointments
- Can manage schedules
- Limited business settings access

**Business Staff**
- Can view assigned leads
- Can update job status
- Read-only business settings

**Public / Anonymous**
- Can visit `/b/[slug]` chat pages
- Can send messages (creates leads)
- Cannot view dashboard or data

## Next Steps After Migration

1. **Update Backend API**
   - Change `businessId` from VARCHAR to UUID
   - Add business lookup by slug
   - Add business membership checks

2. **Add Auth Flow**
   - Signup: Create profile + business
   - Login: Load user's businesses
   - Session: Store current business context

3. **Public Business Pages**
   - Create `/b/[slug]` route
   - Load business by slug
   - Branded chat interface per business

4. **Dashboard Updates**
   - Business selector (if multi-business user)
   - Filter all queries by business_id
   - Team management UI

5. **Onboarding Flow**
   - New business registration
   - Slug availability check
   - Business settings wizard

---

**File:** `MULTI_TENANCY_SCHEMA.md`  
**Related:** `migrations/007_add_multi_tenancy.sql`  
**Status:** Ready to implement
