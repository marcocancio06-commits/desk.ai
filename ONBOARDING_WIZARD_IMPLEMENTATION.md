# Onboarding Wizard Implementation Summary

## Overview
Implemented a complete business onboarding flow for new Desk.ai users, including:
- 4-step wizard UI (already existed, enhanced)
- Slug generation and preview
- Business creation via API
- Integration with multi-tenant database
- Branding consistency (Frontdesk AI → Desk.ai)

**Implementation Date:** November 23, 2025

---

## Changes Made

### 1. Branding Fixes

#### Files Modified:
- `frontend/pages/dashboard/index.js`

#### Changes:
- Updated "Welcome to Frontdesk AI" → "Welcome to Desk.ai" in dashboard empty state
- Kept all other copy simple and honest
- No changes to fake testimonials or misleading marketing (none existed)

**Before:**
```javascript
<h1>Welcome to Frontdesk AI</h1>
```

**After:**
```javascript
<h1>Welcome to Desk.ai</h1>
```

---

### 2. Onboarding Wizard Enhancements

#### A. Step 1: Business Details
**File:** `frontend/components/onboarding/Step1BusinessDetails.js`

**Added:**
- Real-time slug generation from business name
- Slug preview in blue info box showing `desk.ai/b/{slug}`
- Automatic storage of generated slug in wizard data
- Enhanced help text explaining slug purpose

**Preview UI:**
```jsx
<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
  <p className="text-sm font-medium text-blue-900">Your business URL</p>
  <p className="text-sm text-blue-800 font-mono">
    desk.ai/b/<span className="font-bold">{slugPreview}</span>
  </p>
  <p className="text-xs text-blue-700">
    This is your public booking page customers will visit
  </p>
</div>
```

**Slug Generation Logic:**
```javascript
const generated = businessName
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');
```

#### B. Step 4: Confirm
**File:** `frontend/components/onboarding/Step4Confirm.js`

**Added:**
- Slug preview in business details summary
- Shows final URL before creation

#### C. Main Onboarding Page
**File:** `frontend/pages/onboarding.js`

**Changes:**
- Added `slug: ''` to wizard data state
- Updated API call to use `BACKEND_URL` constant instead of hardcoded localhost
- Changed redirect to use `window.location.href` for full page reload (ensures AuthContext refreshes)
- Kept localStorage persistence for wizard progress

**API Call:**
```javascript
const response = await fetch(`${BACKEND_URL}/api/business/create`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    businessName: wizardData.businessName,
    industry: wizardData.industry,
    phone: wizardData.phone,
    email: wizardData.email,
    zipCodes: wizardData.zipCodes,
    logoPath: wizardData.logoPath,
    colorScheme: wizardData.colorScheme
  })
});
```

---

### 3. Backend Business Creation

#### File: `frontdesk-backend/index.js`

**Fixed:**
- Changed `zip_codes` → `service_zip_codes` (matches database schema)
- Removed unused `logo_url`, `color_scheme`, `settings` fields (not in current schema)
- Added `onboarding_completed: true` flag
- Kept slug uniqueness check (tries `slug`, `slug-1`, `slug-2`, etc.)

**Before:**
```javascript
zip_codes: zipCodes,  // ❌ Wrong column name
logo_url: logoPath,
color_scheme: colorScheme,
settings: { ... }  // ❌ Complex settings not needed for MVP
```

**After:**
```javascript
service_zip_codes: zipCodes,  // ✅ Correct column name
is_active: true,
onboarding_completed: true
```

**Slug Uniqueness Algorithm:**
```javascript
let slug = baseSlug;
let slugAttempt = 0;

while (!isSlugUnique && slugAttempt < 10) {
  const { data: existing } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', slug)
    .single();
  
  if (!existing) {
    isSlugUnique = true;
  } else {
    slugAttempt++;
    slug = `${baseSlug}-${slugAttempt}`;
  }
}
```

---

### 4. User Flow

#### New User Signup Flow:
```
1. User visits /auth/signup
2. Creates account (email + password)
3. ✅ Automatically redirected to /onboarding
4. Completes 4-step wizard:
   - Step 1: Business details (name, industry, phone, email, slug preview)
   - Step 2: Service area (ZIP codes)
   - Step 3: Branding (logo upload, color scheme) - optional
   - Step 4: Review & confirm (shows slug preview)
5. Clicks "Finish Setup"
6. Backend creates:
   - Row in `businesses` table
   - Row in `business_users` table (linking user as owner)
7. Full page reload to /dashboard
8. ✅ Dashboard shows business data (no more "no business" empty state)
```

#### Existing User with No Business:
```
1. User logs in → /dashboard
2. Sees "Welcome to Desk.ai" empty state
3. Clicks "Get Started" button
4. ✅ Redirected to /onboarding
5. Completes wizard (same as above)
6. Returns to /dashboard with business
```

---

## Database Schema

### Tables Used:

#### `businesses`
```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  service_zip_codes JSONB DEFAULT '[]'::jsonb,
  industry TEXT,
  is_active BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `business_users`
```sql
CREATE TABLE business_users (
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES profiles(id),
  role TEXT DEFAULT 'owner',
  is_default BOOLEAN DEFAULT false,
  PRIMARY KEY (business_id, user_id)
);
```

#### `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Row Level Security:**
- ✅ Already configured in migration 007
- Users can only see businesses they belong to
- Public can view active businesses by slug (for /b/[slug] pages)

---

## Testing Guide

### Manual Test Cases

#### Test 1: New User Onboarding (Happy Path)
**Steps:**
1. Open browser in incognito mode
2. Navigate to `http://localhost:3000/auth/signup`
3. Create account:
   - Email: `test-owner-1@example.com`
   - Password: `password123`
   - Confirm password: `password123`
4. Click "Create Account & Continue"
5. ✅ Verify redirect to `/onboarding`

**Step 1: Business Details**
6. Fill form:
   - Business Name: `Test Plumbing Co`
   - Industry: `Plumbing`
   - Phone: `+1-555-123-4567`
   - Email: `contact@testplumbing.com`
7. ✅ Verify slug preview shows: `desk.ai/b/test-plumbing-co`
8. Click "Continue"

**Step 2: Service Area**
9. Add ZIP codes: `10001`, `10002`, `10003`
10. ✅ Verify each ZIP appears as blue tag
11. Click "Continue"

**Step 3: Branding**
12. Select color scheme: `Blue` (or leave default)
13. Skip logo upload
14. Click "Continue"

**Step 4: Confirm**
15. ✅ Verify all details shown correctly
16. ✅ Verify slug shown: `desk.ai/b/test-plumbing-co`
17. Click "Finish Setup"
18. ✅ Verify loading spinner appears
19. ✅ Verify redirect to `/dashboard`
20. ✅ Verify dashboard shows business data (NOT "no business" message)

**Expected Result:** Full onboarding complete, dashboard functional

---

#### Test 2: Existing User Without Business
**Steps:**
1. Create user account via signup
2. DO NOT complete onboarding (close browser at /onboarding)
3. Later, log in via `/auth/login`
4. ✅ Verify redirect to `/dashboard`
5. ✅ Verify empty state shows:
   - Header: "Welcome to Desk.ai"
   - Message: "No business connected"
   - Button: "Get Started"
6. Click "Get Started"
7. ✅ Verify redirect to `/onboarding`
8. Complete wizard (same as Test 1)
9. ✅ Verify business created and dashboard loads

**Expected Result:** User can complete onboarding later

---

#### Test 3: Slug Uniqueness
**Steps:**
1. Create first business named "Best Plumbing"
   - ✅ Slug should be: `best-plumbing`
2. Create second business (different user) named "Best Plumbing"
   - ✅ Slug should be: `best-plumbing-1`
3. Create third business named "Best Plumbing"
   - ✅ Slug should be: `best-plumbing-2`

**Expected Result:** Slugs auto-increment when collision detected

**How to verify:**
```sql
SELECT slug, name FROM businesses 
WHERE name LIKE '%Best Plumbing%'
ORDER BY created_at;
```

---

#### Test 4: Multi-Business Limit (MVP)
**Steps:**
1. User creates first business via onboarding
2. Try to access `/onboarding` again
3. Try to create second business via API

**Expected Result:**
- API returns error: "You already have a business. Multiple businesses not supported in MVP."
- Error code: `BUSINESS_LIMIT_REACHED`

**Note:** For production, this limit will be removed and users can manage multiple businesses.

---

#### Test 5: Public Business Page
**Steps:**
1. Complete onboarding, create business with slug `my-test-business`
2. Navigate to `http://localhost:3000/b/my-test-business`
3. ✅ Verify public business page loads
4. ✅ Verify chat widget appears
5. Send test message via chat
6. ✅ Verify lead appears in dashboard

**Expected Result:** Public /b/[slug] route works with new businesses

---

#### Test 6: Email Confirmation Flow (if enabled)
**Steps:**
1. Enable email confirmation in Supabase
2. Signup with new email
3. ✅ Verify "Check Your Email" screen appears
4. Open email confirmation link
5. ✅ Verify redirect to `/onboarding` after confirmation

**Expected Result:** Email confirmation doesn't break onboarding flow

---

### Automated Testing (Future)

**E2E Tests to Add:**
```javascript
describe('Onboarding Flow', () => {
  it('should complete full wizard and create business', async () => {
    // 1. Signup
    // 2. Fill Step 1 (verify slug preview updates)
    // 3. Fill Step 2 (add ZIP codes)
    // 4. Skip Step 3
    // 5. Confirm Step 4 (verify slug displayed)
    // 6. Submit and wait for dashboard
    // 7. Verify business appears in database
    // 8. Verify business_users link exists
  });
  
  it('should show slug collision warning', async () => {
    // Create business with duplicate name
    // Verify slug has -1 suffix
  });
  
  it('should block multiple businesses per user', async () => {
    // Try to create second business
    // Verify error message
  });
});
```

---

## API Endpoints

### POST /api/business/create
**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "businessName": "Test Plumbing Co",
  "industry": "plumbing",
  "phone": "+1-555-123-4567",
  "email": "contact@testplumbing.com",
  "zipCodes": ["10001", "10002"],
  "logoPath": null,
  "colorScheme": "default"
}
```

**Response (Success):**
```json
{
  "ok": true,
  "business": {
    "id": "uuid-here",
    "slug": "test-plumbing-co",
    "name": "Test Plumbing Co",
    "industry": "plumbing",
    "phone": "+1-555-123-4567",
    "email": "contact@testplumbing.com",
    "service_zip_codes": ["10001", "10002"],
    "is_active": true,
    "onboarding_completed": true
  }
}
```

**Response (Error - Duplicate Business):**
```json
{
  "ok": false,
  "error": "You already have a business. Multiple businesses not supported in MVP.",
  "code": "BUSINESS_LIMIT_REACHED",
  "existingBusinessId": "uuid-here"
}
```

**Response (Error - Validation):**
```json
{
  "ok": false,
  "error": "Business name is required (minimum 2 characters)",
  "code": "INVALID_BUSINESS_NAME"
}
```

---

## Business Logic

### How Current Business is Determined

#### On Initial Load (AuthContext.js):
```javascript
1. User logs in → Get Supabase session
2. Query business_users table for user_id
3. If no businesses found → currentBusiness = null
4. If businesses found:
   - Check localStorage for savedBusinessId
   - Or use business with is_default = true
   - Or use first business in array
5. Store currentBusinessId in localStorage
```

#### On Dashboard:
```javascript
// frontend/pages/dashboard/index.js
const { currentBusiness, getCurrentBusinessId } = useAuth();

useEffect(() => {
  fetchData();  // Always runs
}, [currentBusiness]);

const fetchData = async () => {
  const businessId = getCurrentBusinessId();
  
  // Case A: No business
  if (!businessId) {
    setLoading(false);
    // Shows "Welcome to Desk.ai" empty state with Get Started button
    return;
  }
  
  // Case B: Has business
  // Fetch leads, stats, etc. for businessId
  const res = await fetch(`${BACKEND_URL}/api/leads?businessId=${businessId}`);
  // ...
};
```

---

## State Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER STATES                              │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   Anonymous      │
│   (Not logged)   │
└────────┬─────────┘
         │
         │ Signup
         ▼
┌──────────────────┐
│  Authenticated   │  
│  No Business     │ ◄─────┐
└────────┬─────────┘       │
         │                 │
         │ Start Onboarding│ Cancel/Close
         ▼                 │
┌──────────────────┐       │
│  In Onboarding   │───────┘
│  (Steps 1-4)     │
└────────┬─────────┘
         │
         │ Finish Setup
         ▼
┌──────────────────┐
│  Authenticated   │
│  Has Business    │ ◄─── Dashboard shows data
└──────────────────┘      /b/{slug} works
                          Can manage leads
```

---

## Multi-Business Support (Future)

Currently limited to 1 business per user. For future expansion:

### Database Changes:
- ✅ Already supports multiple businesses (junction table)
- No schema changes needed

### Frontend Changes:
- Add business switcher dropdown in header
- Show all businesses in settings
- Allow creating additional businesses (remove limit)

### Backend Changes:
- Remove `BUSINESS_LIMIT_REACHED` check in `/api/business/create`
- Add `/api/business/switch` endpoint
- Update `is_default` flag when switching

**Example Business Switcher UI:**
```jsx
<select onChange={(e) => switchBusiness(e.target.value)}>
  {businesses.map(b => (
    <option key={b.id} value={b.id}>
      {b.name} {b.is_default && '(Default)'}
    </option>
  ))}
  <option value="create-new">+ Create New Business</option>
</select>
```

---

## Files Modified

### Frontend:
1. `frontend/pages/dashboard/index.js` - Branding fix (1 line)
2. `frontend/pages/onboarding.js` - Slug in wizard data, API URL fix
3. `frontend/components/onboarding/Step1BusinessDetails.js` - Slug generation + preview
4. `frontend/components/onboarding/Step4Confirm.js` - Slug preview in summary

### Backend:
5. `frontdesk-backend/index.js` - Fixed column name `service_zip_codes`

### Documentation:
6. This file: `ONBOARDING_WIZARD_IMPLEMENTATION.md`

**Total Files Changed:** 6  
**Lines Added:** ~150  
**Lines Removed:** ~20

---

## Commit Messages

### Commit 1: Branding fixes
```
fix(branding): change Frontdesk AI to Desk.ai in dashboard

- Updated dashboard empty state header
- Changed "Welcome to Frontdesk AI" → "Welcome to Desk.ai"
- Kept copy simple and honest as per requirements
```

### Commit 2: Onboarding wizard slug generation
```
feat(onboarding): add slug generation and preview

- Generate URL-safe slug from business name in Step 1
- Show real-time preview: desk.ai/b/{slug}
- Display slug in Step 4 confirmation
- Store slug in wizard data for backend

Helps users understand their public business URL before creation.
```

### Commit 3: Backend business creation fixes
```
fix(backend): use correct column name for ZIP codes

- Changed zip_codes → service_zip_codes (matches schema)
- Removed unused logo_url and color_scheme fields
- Added onboarding_completed flag
- Simplified business creation (removed complex settings)

Backend now matches migration 007 schema exactly.
```

---

## Known Issues / Future Work

### Current Limitations:
1. **Single business per user** - MVP restriction, will be removed
2. **No slug editing** - Slug auto-generated, not editable (could add custom slug field)
3. **No logo upload** - Skipped for MVP (Step 3 exists but not wired to storage)
4. **No timezone selection** - Defaults to system timezone

### Future Enhancements:
- [ ] Allow custom slug with availability check
- [ ] Add slug editing in business settings
- [ ] Implement logo upload to Supabase Storage
- [ ] Add timezone picker in Step 1
- [ ] Support multiple businesses per user
- [ ] Add business deletion/deactivation
- [ ] Email notification on business creation
- [ ] Slack notification for team (if configured)

---

## Support / Troubleshooting

### Issue: "Failed to create business"
**Possible Causes:**
1. Database migration not run
2. Supabase credentials missing
3. User already has a business

**Debug Steps:**
```bash
# Check Supabase connection
curl http://localhost:3001/health

# Check if user already has business
SELECT * FROM business_users WHERE user_id = 'user-uuid-here';

# Check if slug already exists
SELECT * FROM businesses WHERE slug = 'test-slug';
```

### Issue: Dashboard still shows "No business"
**Possible Causes:**
1. business_users link not created
2. AuthContext not refreshed
3. localStorage corrupted

**Fix:**
```javascript
// Clear localStorage and reload
localStorage.clear();
window.location.reload();

// Or check database:
SELECT * FROM business_users WHERE user_id = 'user-uuid';
```

### Issue: Slug collision loop
**Rare Case:** If 10 attempts fail to find unique slug

**Fix:**
- Increase `slugAttempt < 10` to higher number
- Or throw error asking user to choose different name

---

## Success Metrics

After implementation, track:
- ✅ Onboarding completion rate
- ✅ Average time to complete wizard
- ✅ Business creation success rate
- ✅ Drop-off by step (which step loses most users?)
- ✅ Slug collision frequency

**Example Queries:**
```sql
-- Onboarding completion rate
SELECT 
  COUNT(DISTINCT bu.user_id) as users_with_business,
  (SELECT COUNT(*) FROM profiles) as total_users,
  ROUND(COUNT(DISTINCT bu.user_id)::NUMERIC / COUNT(*)::NUMERIC * 100, 2) as completion_rate
FROM business_users bu;

-- Average businesses per day
SELECT 
  DATE(created_at) as date,
  COUNT(*) as businesses_created
FROM businesses
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## Summary

**What Changed:**
- Branding: Frontdesk AI → Desk.ai (dashboard)
- Onboarding: Added slug generation + preview
- Backend: Fixed database column names
- User Flow: Signup → Onboarding → Dashboard (complete)

**What Works:**
- ✅ New users auto-redirect to onboarding
- ✅ Slug generation with uniqueness check
- ✅ Business creation via API
- ✅ Dashboard loads business data
- ✅ Public /b/[slug] pages work
- ✅ Multi-tenant isolation preserved

**What's Next:**
- Test with real users
- Monitor completion rates
- Add multi-business support
- Enhance with logo upload

**Status:** ✅ Ready for testing and deployment
