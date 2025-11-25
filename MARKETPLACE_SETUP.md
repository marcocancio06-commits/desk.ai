# 🏪 Marketplace Setup Guide

## Current Status

The marketplace feature is **partially implemented** but requires database setup to function.

### ✅ What's Complete
- Marketplace frontend UI at `/marketplace`
- Backend API endpoint at `/api/marketplace`
- Database schema defined in migrations
- RLS policies defined
- `is_listed` column for marketplace visibility

### ❌ What's Missing
- **Database tables not created in Supabase**
- The `businesses` table doesn't exist in your Supabase project yet
- Migration `007_add_multi_tenancy.sql` needs to be run

---

## Issue Detected

When testing the marketplace endpoint:
```bash
curl http://localhost:3001/api/marketplace
```

**Error received:**
```json
{
  "error": "Failed to fetch marketplace businesses",
  "debug": {
    "code": "PGRST205",
    "message": "Could not find the table 'public.businesses' in the schema cache",
    "hint": "Perhaps you meant the table 'public.business_settings'"
  }
}
```

This confirms that:
1. Supabase is connected ✅
2. Some tables exist (`business_settings`) ✅
3. The `businesses` table is **missing** ❌

---

## How to Fix

### Option 1: Run Migration in Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `frontdesk-backend/migrations/007_add_multi_tenancy.sql`
5. Paste and run the SQL
6. Also run `migrations/add_is_listed_to_businesses.sql` (if not already included)

### Option 2: Use Supabase CLI

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref gvjowuscugbgvnemrlmi

# Run migrations
supabase db push

# Or manually run specific migration
supabase db execute --file frontdesk-backend/migrations/007_add_multi_tenancy.sql
```

### Option 3: Run from DATABASE_SCHEMA.sql

The file `DATABASE_SCHEMA.sql` in the root directory contains the complete schema. You can:

1. Open Supabase SQL Editor
2. Copy/paste the entire contents of `DATABASE_SCHEMA.sql`
3. Run it

This will create:
- `businesses` table
- `profiles` table  
- `business_users` table
- `leads` table
- `conversations` table
- `messages` table
- `appointments` table
- All necessary indexes and RLS policies

---

## What the Migration Creates

The `007_add_multi_tenancy.sql` migration creates:

### Tables
- **businesses** - Core business profiles
  - `id`, `slug`, `name`, `industry`, `phone`, `email`
  - `service_zip_codes` - Array of served ZIP codes
  - `is_active` - Whether business is active
  - `is_listed` - **Whether business appears in marketplace**
  - `logo_url`, `color_scheme`, etc.

- **profiles** - User profiles extending auth.users
  - Links to Supabase auth
  - Role field (owner/client)

- **business_users** - Many-to-many relationship
  - Links users to businesses
  - Role within business

- **leads**, **conversations**, **messages**, **appointments**
  - Full CRM functionality

### RLS Policies
- Public businesses are viewable by everyone (is_active = true)
- Users can view businesses they belong to
- Users can manage their own profiles
- Business-scoped data access

---

## Testing After Setup

Once you've run the migrations:

### 1. Verify Table Exists
```bash
curl http://localhost:3001/api/marketplace
```

**Expected response** (if no businesses listed):
```json
{
  "ok": true,
  "businesses": [],
  "count": 0
}
```

### 2. Add a Test Business to Marketplace

In Supabase SQL Editor:
```sql
-- Insert a test business (or update existing)
INSERT INTO businesses (slug, name, industry, phone, email, is_active, is_listed)
VALUES ('demo-plumbing', 'Demo Plumbing Co', 'Plumbing', '555-1234', 'demo@example.com', true, true)
ON CONFLICT (slug) 
DO UPDATE SET is_listed = true;
```

### 3. Test Marketplace Again
```bash
curl http://localhost:3001/api/marketplace
```

**Expected response:**
```json
{
  "ok": true,
  "businesses": [
    {
      "id": "...",
      "slug": "demo-plumbing",
      "name": "Demo Plumbing Co",
      "industry": "Plumbing",
      "service_zip_codes": [],
      "logo_url": null,
      "color_scheme": "default"
    }
  ],
  "count": 1
}
```

### 4. View in Frontend
Visit: http://localhost:3003/marketplace

You should see:
- The demo plumbing business card
- Ability to filter by industry/ZIP
- "Chat with this business" button linking to `/b/demo-plumbing`

---

## Making Businesses Public

To list a business in the marketplace:

```sql
UPDATE businesses 
SET is_listed = true 
WHERE slug = 'your-business-slug';
```

To remove from marketplace:

```sql
UPDATE businesses 
SET is_listed = false 
WHERE slug = 'your-business-slug';
```

---

## Files Modified for Marketplace

### Backend
- `frontdesk-backend/index.js` (line 1806)
  - Added `/api/marketplace` endpoint
  - Uses service role key to bypass RLS
  - Returns public business data

### Frontend
- `frontend/pages/marketplace.js`
  - Complete marketplace UI
  - Client-side search/filter
  - Business cards with links to `/b/[slug]`
  - Enhanced error and empty states
  - Beta marketplace badge
  - Improved footer panel

### Database
- `migrations/add_is_listed_to_businesses.sql`
  - Adds `is_listed` boolean column
  - Creates index on `is_listed`
  - Sets demo-plumbing to is_listed = true

### Environment
- Uses `SUPABASE_SERVICE_ROLE_KEY` for marketplace queries
  - Bypasses RLS for public marketplace access
  - Already configured in your `.env`

---

## Next Steps

1. **Run the database migration** (choose one option above)
2. **Restart the backend** if needed
3. **Test the API** with curl
4. **Add test data** (mark a business as is_listed = true)
5. **Visit the marketplace** at http://localhost:3003/marketplace
6. **Verify business cards** link to `/b/[slug]` pages

---

## Troubleshooting

### "Table not found" Error
- The migration hasn't been run yet
- Run `007_add_multi_tenancy.sql` in Supabase

### "No businesses found" (empty marketplace)
- No businesses have `is_listed = true`
- Update a business: `UPDATE businesses SET is_listed = true WHERE...`

### RLS Policy Blocking Access
- Marketplace endpoint now uses service role key
- Bypasses RLS completely for public queries

### Frontend Shows Error
- Backend might not be running
- Check: `curl http://localhost:3001/health`
- Restart if needed: `cd frontdesk-backend && npm run dev`

---

## Documentation Files

- `MARKETPLACE_IMPLEMENTATION.md` - Full implementation details
- `DATABASE_SCHEMA.sql` - Complete database schema
- `frontdesk-backend/migrations/007_add_multi_tenancy.sql` - Multi-tenancy migration
- `migrations/add_is_listed_to_businesses.sql` - Marketplace visibility flag

---

Last Updated: November 24, 2025
Status: Awaiting database migration ⏳
