# Marketplace Setup Guide

**Date**: November 24, 2025  
**Status**: Ready to Run

---

## Problem Identified

The marketplace page at `/marketplace` shows a red error:
> "We couldn't load the marketplace. Please refresh the page or try again later."

**Root Cause**: The `businesses` table doesn't exist in your Supabase database yet. Migrations 007 and 008 haven't been run.

---

## Solution: 3-Step Setup

### Step 1: Run Database Setup in Supabase

You have **two options** depending on whether you've run any migrations:

#### Option A: Fresh Setup (No Migrations Run Yet)
**Use this if**: You haven't run migrations 007 or 008 in Supabase

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `gvjowuscugbgvnemrlmi`
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy and paste the entire contents of: **`SETUP_MARKETPLACE.sql`**
6. Click **Run** (or press Cmd+Enter)

**What this does**:
- Creates `businesses` table with all required columns
- Adds marketplace fields (`is_public`, `tagline`, `short_description`)
- Creates indexes for fast queries
- Sets up Row Level Security (RLS) policies
- Seeds 2 example businesses

#### Option B: Migrations Already Run (Partial Setup)
**Use this if**: Migrations 007 and 008 are already run, you just need seed data

1. Open Supabase Dashboard SQL Editor
2. Copy and paste: **`SEED_MARKETPLACE.sql`**
3. Click **Run**

**What this does**:
- Only adds the 2 seed businesses
- Skips table creation (assumes it exists)

---

### Step 2: Verify Database Setup

After running the SQL, you should see verification output in the SQL Editor:

```
name                      | slug                      | industry | is_public | tagline
--------------------------+---------------------------+----------+-----------+-----------------------------------
Houston Premier Plumbing  | houston-premier-plumbing  | plumbing | true      | Fast, Reliable Plumbing Services
Bayou HVAC Specialists    | bayou-hvac-specialists    | hvac     | true      | Keep Houston Cool & Comfortable
```

If you see this, ✅ **database setup is complete!**

---

### Step 3: Test the Marketplace

1. **Visit**: http://localhost:3000/marketplace

2. **You should see**:
   - Clean header with Growzone logo
   - "Beta Marketplace" badge
   - Search and filter controls
   - **2 business cards** with:
     - Houston Premier Plumbing (plumbing)
     - Bayou HVAC Specialists (HVAC)

3. **Test Filters**:
   - **Search**: Type "plumbing" → should show only Houston Premier Plumbing
   - **Industry**: Type "hvac" → should show only Bayou HVAC Specialists
   - **ZIP**: Type "77005" → should show both businesses
   - **Clear filters**: Should return to showing both

4. **Test Business Page**:
   - Click "💬 Chat with this business" on either card
   - Should redirect to `/b/houston-premier-plumbing` or `/b/bayou-hvac-specialists`
   - Should show tagline and description
   - Chat interface should load

---

## Data Model Reference

### `businesses` Table Schema

```sql
CREATE TABLE businesses (
  -- Identifiers
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE,           -- URL-safe: houston-premier-plumbing
  name TEXT,                  -- Display name: Houston Premier Plumbing
  
  -- Contact
  phone TEXT,
  email TEXT,
  
  -- Service Info
  service_zip_codes JSONB,    -- Array: ["77005", "77030"]
  industry TEXT,              -- plumbing, hvac, electrical, etc.
  
  -- Marketplace Fields (Migration 008)
  is_public BOOLEAN,          -- true = shows in marketplace
  tagline TEXT,               -- Max 60 chars
  short_description TEXT,     -- Max 200 chars
  
  -- Branding
  logo_url TEXT,
  
  -- Status
  is_active BOOLEAN,
  onboarding_completed BOOLEAN,
  
  -- Timestamps
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Key Fields for Marketplace

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `id` | UUID | Unique identifier | `a1b2c3d4-...` |
| `slug` | TEXT | URL-safe name | `houston-premier-plumbing` |
| `name` | TEXT | Display name | `Houston Premier Plumbing` |
| `industry` | TEXT | Service type | `plumbing`, `hvac` |
| `service_zip_codes` | JSONB | Service area | `["77005", "77030"]` |
| `is_public` | BOOLEAN | Show in marketplace | `true` |
| `tagline` | TEXT | Short pitch (60 chars) | `Fast, Reliable Plumbing Services` |
| `short_description` | TEXT | Details (200 chars) | `Licensed plumbers available 24/7...` |

---

## API Endpoint Reference

### `GET /api/marketplace`

**URL**: `http://localhost:3001/api/marketplace`

**Query**: 
```sql
SELECT * FROM businesses 
WHERE is_active = true AND is_public = true 
ORDER BY created_at DESC
```

**Response**:
```json
{
  "ok": true,
  "businesses": [
    {
      "id": "uuid",
      "slug": "houston-premier-plumbing",
      "name": "Houston Premier Plumbing",
      "industry": "plumbing",
      "tagline": "Fast, Reliable Plumbing Services",
      "short_description": "Licensed plumbers available 24/7...",
      "service_zip_codes": ["77005", "77030", "77019", "77098"],
      "logo_url": null
    }
  ],
  "count": 2
}
```

**Security**: 
- Uses service role key to bypass RLS
- Only returns safe, public fields
- No owner emails, internal notes, or sensitive data

---

## Frontend States

The marketplace page now has **4 distinct states**:

### 1. Loading State
```
🔵 Loading spinner
"Loading marketplace..."
```

### 2. Error State (Network/Server Error)
```
🔴 Error icon
"We couldn't load the marketplace"
"Please refresh the page or try again later."
[Refresh page] button
```

### 3. Empty State (No Public Businesses)
```
📦 Empty box icon
"No businesses visible in Growzone Market yet"
"Once business owners opt in to appear in the marketplace, they'll show up here."
[Add your business] [Learn about Desk.ai] buttons
```

### 4. No Filter Results
```
🔍 Search icon
"No businesses match these filters"
"Try adjusting your search criteria..."
[Clear all filters] button
```

---

## Files Changed

### New Files Created:
1. **`SETUP_MARKETPLACE.sql`** - Complete database setup + seed data
2. **`SEED_MARKETPLACE.sql`** - Seed data only (if migrations already run)
3. **`MARKETPLACE_SETUP_GUIDE.md`** - This file

### Modified Files:
1. **`frontend/pages/marketplace.js`**
   - Better error handling (parse error messages)
   - Distinguish between "fetch failed" and "no results"
   - Separate empty states for "no businesses" vs "no filter results"
   - Improved error logging

---

## Seed Business Details

### Business #1: Houston Premier Plumbing
- **Slug**: `houston-premier-plumbing`
- **Industry**: Plumbing
- **Service Area**: 77005, 77030, 77019, 77098
- **Tagline**: "Fast, Reliable Plumbing Services"
- **Description**: "Licensed plumbers available 24/7 for all your plumbing needs. Emergency services, repairs, and installations throughout Houston."
- **Created**: 15 days ago (so it appears established)

### Business #2: Bayou HVAC Specialists
- **Slug**: `bayou-hvac-specialists`
- **Industry**: HVAC
- **Service Area**: 77005, 77025, 77056, 77024
- **Tagline**: "Keep Houston Cool & Comfortable"
- **Description**: "Expert HVAC installation, repair, and maintenance. Serving Houston homeowners and businesses with honest, professional service."
- **Created**: 8 days ago

**Why These?**
- Realistic Houston-area ZIP codes
- Different industries (plumbing, HVAC)
- Honest, professional copy (no fake testimonials)
- Overlapping service area (77005) so filters work well
- Generic enough for demo but specific enough to feel real

---

## How to Re-Run If You Reset DB

If you blow away the database and need to set it up again:

### Option 1: Full Reset
```bash
# In Supabase SQL Editor, run:
DROP TABLE IF EXISTS businesses CASCADE;

# Then run SETUP_MARKETPLACE.sql again
```

### Option 2: Just Clear Seed Data
```sql
DELETE FROM businesses WHERE slug IN ('houston-premier-plumbing', 'bayou-hvac-specialists');

-- Then run SEED_MARKETPLACE.sql again
```

---

## Troubleshooting

### Error: "Could not find the table 'public.businesses'"
**Solution**: Run `SETUP_MARKETPLACE.sql` (full setup)

### Error: "column businesses.is_public does not exist"
**Solution**: Run migration 008 or use `SETUP_MARKETPLACE.sql`

### No businesses showing even after seed
**Check**:
```sql
SELECT name, is_public, is_active 
FROM businesses 
WHERE slug IN ('houston-premier-plumbing', 'bayou-hvac-specialists');
```
Both should have `is_public = true` and `is_active = true`

### Filters not working
**Check**:
- Backend running on port 3001
- Frontend running on port 3000
- Open browser console for errors
- Test API directly: `curl http://localhost:3001/api/marketplace`

---

## Testing Checklist

- [ ] Database setup complete (ran SQL)
- [ ] See 2 businesses in verification query
- [ ] Visit `/marketplace` - no red error
- [ ] See 2 business cards
- [ ] Search "plumbing" → 1 result
- [ ] Search "hvac" → 1 result
- [ ] ZIP filter "77005" → 2 results
- [ ] ZIP filter "77098" → 1 result (Houston Premier only)
- [ ] Clear filters works
- [ ] Click business card → redirects to `/b/[slug]`
- [ ] Business page shows tagline & description
- [ ] Chat interface loads on business page

---

## Next Steps (After Marketplace Works)

1. **Add Real Business**: 
   - Sign up as owner
   - Complete onboarding
   - Toggle marketplace visibility ON
   - Add tagline and description
   - Verify it appears in marketplace

2. **Test Customer Flow**:
   - Browse marketplace
   - Find business
   - Start chat
   - Verify lead captured in owner dashboard

3. **Polish**:
   - Add more seed businesses (optional)
   - Test on mobile
   - Share with first users

---

**Setup Complete!** 🎉

Once you run the SQL, the marketplace should work end-to-end with 2 example businesses.
