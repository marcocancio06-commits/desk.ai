# Multi-Tenancy Migration Summary

## Overview
This migration transforms Desk.ai from a single-business demo into a full multi-tenant SaaS platform where multiple businesses can each have their own isolated account, dashboard, leads, and appointments.

## What Changed

### New Tables Created

#### 1. `businesses` table
The core table for business entities. Each business is completely isolated.

**Key Fields:**
- `id` (UUID, PK) - Unique business identifier
- `slug` (TEXT, UNIQUE) - URL-safe identifier (e.g., `demo-plumbing`, `houston-hvac-pro`)
- `name` (TEXT) - Display name (e.g., "Houston Premier Plumbing")
- `phone`, `email` - Contact information
- `service_zip_codes` (JSONB) - Array of ZIP codes served
- `industry` (TEXT) - Business type (plumbing, hvac, electrical, etc.)
- `services`, `pricing`, `hours`, `policies` (JSONB) - Business configuration
- `is_active` (BOOLEAN) - Whether business is active
- `onboarding_completed` (BOOLEAN) - Whether setup is complete
- `subscription_tier` (TEXT) - trial, basic, pro, enterprise

**Indexes:**
- `slug` - For fast public URL lookups (`/b/demo-plumbing`)
- `industry` - For directory/search features
- `is_active` - Filter active businesses
- `created_at` - Sort by creation date

#### 2. `profiles` table
User profiles linked to Supabase `auth.users`. One profile per authenticated user.

**Key Fields:**
- `id` (UUID, PK) - References `auth.users.id`
- `full_name` (TEXT) - User's full name
- `avatar_url` (TEXT) - Profile picture
- `phone` (TEXT) - Contact phone
- `role` (TEXT) - Global role: `user`, `admin`, `super_admin`
- `preferences` (JSONB) - User preferences/settings

**Important:** This table is automatically populated when a user signs up via Supabase Auth.

#### 3. `business_users` table
Many-to-many junction table. Links users to businesses they have access to.

**Key Fields:**
- `business_id` (UUID, FK → businesses.id)
- `user_id` (UUID, FK → profiles.id)
- `role` (TEXT) - Role within THIS business: `owner`, `manager`, `staff`, `viewer`
- `is_default` (BOOLEAN) - If user belongs to multiple businesses, which is default
- `permissions` (JSONB) - Fine-grained permissions (optional, for future)

**Composite PK:** `(business_id, user_id)` - Each user can only belong to a business once

### Updated Tables

#### `leads` table
- **Added:** `business_id` (UUID, FK → businesses.id)
- **Migrated:** Old VARCHAR `business_id` → UUID FK
- **Also added (from previous migration):** `sms_enabled`, `last_sms_at`, `sms_opt_out`

**Important:** All existing leads automatically linked to demo business (`00000000-0000-0000-0000-000000000001`)

#### `appointments` table
- **Added:** `business_id` (UUID, FK → businesses.id)
- **Migrated:** Old VARCHAR `business_id` → UUID FK

**Important:** All existing appointments automatically linked to demo business

#### `messages` table
- **Added (from previous migration):** Twilio SMS fields (`twilio_sid`, `direction`, `from_number`, etc.)

### Row Level Security (RLS)

**Business Isolation Policies:**

1. **Businesses:**
   - Anyone can view active businesses (for public directory)
   - Users can only view/edit businesses they belong to

2. **Leads:**
   - Users can only see leads from businesses they're members of
   - Prevents cross-business data leaks

3. **Appointments:**
   - Same isolation as leads
   - Each business only sees their own appointments

4. **Profiles:**
   - Users can only view/edit their own profile

5. **Business Users:**
   - Users can view their own business memberships

## Demo Business Seeded

**Business Details:**
- **Slug:** `demo-plumbing`
- **ID:** `00000000-0000-0000-0000-000000000001` (fixed UUID)
- **Name:** Houston Premier Plumbing
- **Phone:** +1-713-555-0100
- **Email:** contact@houstonpremierplumbing.com
- **ZIP Codes:** 77005, 77030, 77098, 77025, 77019
- **Industry:** plumbing
- **Status:** Active, onboarded, Pro tier

**All existing demo data** (leads, appointments, messages) automatically linked to this business.

## Public URLs

With the new `slug` field, each business gets a public URL:

```
/b/demo-plumbing        → Houston Premier Plumbing chat page
/b/houston-hvac-pro     → Another business's chat page
/b/austin-electrical    → Another business's chat page
```

The slug is:
- Lowercase only
- Alphanumeric + hyphens
- Unique across all businesses
- URL-safe

## Helper Views Created

### `businesses_with_stats`
Shows each business with aggregated counts:
```sql
SELECT * FROM businesses_with_stats;
-- Returns: business data + user_count + lead_count + appointment_count
```

### `users_with_businesses`
Shows which users belong to which businesses:
```sql
SELECT * FROM users_with_businesses 
WHERE user_id = 'some-uuid';
-- Returns: all businesses this user has access to, with their role in each
```

## Migration Safety

✅ **Idempotent** - Safe to run multiple times  
✅ **Non-destructive** - Doesn't drop existing data  
✅ **Backwards compatible** - Existing demo data preserved  
✅ **Graceful** - Handles existing columns, doesn't error on duplicates

The migration uses `IF NOT EXISTS`, `DO $$` blocks, and `ON CONFLICT` to safely handle:
- Tables/columns that already exist
- Data that's already been migrated
- Constraints that are already in place

## How to Run

### Option 1: Supabase SQL Editor
1. Go to your Supabase dashboard
2. Click **SQL Editor**
3. Paste the contents of `007_add_multi_tenancy.sql`
4. Click **Run**

### Option 2: Command Line (if using psql)
```bash
psql $DATABASE_URL -f migrations/007_add_multi_tenancy.sql
```

### Verify Migration
```sql
-- Check tables were created
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('businesses', 'profiles', 'business_users');

-- Check demo business exists
SELECT slug, name, industry FROM businesses 
WHERE slug = 'demo-plumbing';

-- Check leads are linked
SELECT COUNT(*) FROM leads 
WHERE business_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('businesses', 'leads', 'appointments');
```

## What's Next

After running this migration:

1. ✅ Database structure supports multi-tenancy
2. ✅ Demo business exists and works as before
3. ⏭️ Update backend API to use UUID business_id
4. ⏭️ Add business registration/onboarding flow
5. ⏭️ Create public business pages (`/b/[slug]`)
6. ⏭️ Add user authentication and session management
7. ⏭️ Update dashboard to filter by user's business(es)

## Breaking Changes

⚠️ **API Changes Required:**

The old `business_id` format was a VARCHAR string like `"demo-business-001"`.  
The new format is a UUID like `"00000000-0000-0000-0000-000000000001"`.

**You'll need to update:**
- Backend API endpoints to accept UUID instead of string
- Frontend code that passes `businessId` to APIs
- Any hardcoded business IDs

**Migration path:**
- Old leads/appointments have `business_id_old` (VARCHAR) preserved
- New `business_id` (UUID) is populated from migration
- You can drop `business_id_old` columns once migration is verified

## Rollback Plan

If you need to rollback:

```sql
-- Drop new tables
DROP TABLE IF EXISTS business_users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;

-- Restore old business_id columns
ALTER TABLE leads DROP COLUMN IF EXISTS business_id;
ALTER TABLE leads RENAME COLUMN business_id_old TO business_id;

ALTER TABLE appointments DROP COLUMN IF EXISTS business_id;
ALTER TABLE appointments RENAME COLUMN business_id_old TO business_id;
```

**Note:** Only do this if migration failed. The old data is preserved in `*_old` columns.

## SQL Statements Summary

**Tables Created:**
1. `businesses` - Core business entities with slug, name, contact, settings
2. `profiles` - User profiles linked to auth.users
3. `business_users` - Many-to-many user ↔ business memberships

**Tables Updated:**
1. `leads` - Added `business_id` UUID FK
2. `appointments` - Added `business_id` UUID FK
3. `messages` - Added Twilio fields (from previous migration)

**Indexes Created:**
- 15+ indexes for performance on slug, business_id, user_id, etc.

**RLS Policies:**
- 12 policies for business isolation and data security

**Views Created:**
- `businesses_with_stats` - Business analytics
- `users_with_businesses` - User memberships

**Seed Data:**
- 1 demo business (`demo-plumbing`)
- All existing leads/appointments linked to demo business

---

**Migration File:** `migrations/007_add_multi_tenancy.sql`  
**Lines of SQL:** ~650 lines  
**Estimated Run Time:** 5-10 seconds
