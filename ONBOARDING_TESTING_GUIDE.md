# Business Onboarding Wizard - Testing Guide

## Overview
This guide provides step-by-step testing procedures for the new business onboarding wizard (Step 8 implementation).

**User Flow:**
1. User signs up with email/password → Supabase Auth creates user
2. User redirected to `/onboarding` wizard
3. User completes 4-step wizard (Business Details, Service Area, Branding, Confirm)
4. Backend creates `businesses` row and `business_users` link
5. User redirected to dashboard with active business

---

## Prerequisites

### 1. Start Development Servers
```bash
# Terminal 1: Backend
cd frontdesk-backend
npm start

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 2. Verify Database Schema
Ensure these tables exist in Supabase:
- `businesses` (with columns: id, name, slug, industry, phone, email, zip_codes, logo_url, color_scheme, is_active, settings, created_at, updated_at)
- `business_users` (with columns: id, user_id, business_id, role, is_default, created_at)
- `profiles` (with columns: id, full_name, phone, created_at)

---

## Test Suite

### Test 1: Complete Happy Path Flow

**Objective:** Test full signup → onboarding → business creation flow

**Steps:**
1. Navigate to http://localhost:3000/auth/signup
2. Enter email: `test-owner@example.com`
3. Enter password: `password123`
4. Enter confirm password: `password123`
5. Click "Create Account & Continue"
6. **Expected:** Redirected to `/onboarding`

**Step 1: Business Details**
7. Enter business name: `Houston Premier Plumbing`
8. Select industry: `Plumbing`
9. Enter phone: `+1-713-555-0100`
10. Enter email: `info@houstonplumbing.com`
11. Click "Next: Service Area"
12. **Expected:** Progress to Step 2 (50% complete)

**Step 2: Service Area**
13. Enter ZIP code: `77005`
14. Click "Add ZIP Code"
15. **Expected:** ZIP code appears as blue chip
16. Enter ZIP code: `77030`
17. Click "Add ZIP Code"
18. Enter ZIP code: `77098`
19. Click "Add ZIP Code"
20. **Expected:** 3 ZIP codes showing
21. Click "Next: Branding"
22. **Expected:** Progress to Step 3 (75% complete)

**Step 3: Branding**
23. Click "Choose File" to upload logo (optional)
24. Select a PNG/JPG file (<2MB)
25. **Expected:** Logo preview shows
26. Select color scheme: `Professional Blue`
27. **Expected:** Preview shows blue button
28. Click "Next: Review"
29. **Expected:** Progress to Step 4 (100% complete)

**Step 4: Confirm**
30. **Verify displayed summary:**
    - Business Name: Houston Premier Plumbing
    - Industry: Plumbing
    - Phone: +1-713-555-0100
    - Email: info@houstonplumbing.com
    - Service Area: 77005, 77030, 77098
    - Logo: Uploaded
    - Color Scheme: Professional Blue
31. Click "Finish Setup"
32. **Expected:** Loading spinner appears
33. **Expected:** Redirected to `/dashboard` (within 2 seconds)

**Database Verification:**
```sql
-- Check business was created
SELECT * FROM businesses WHERE name = 'Houston Premier Plumbing';
-- Expected: 1 row with slug 'houston-premier-plumbing', industry 'plumbing'

-- Check business_users link
SELECT * FROM business_users WHERE business_id = <business_id_from_above>;
-- Expected: 1 row with role 'owner', is_default = true

-- Check user's auth record
SELECT * FROM auth.users WHERE email = 'test-owner@example.com';
-- Expected: 1 row with confirmed_at NOT NULL
```

**API Verification:**
```bash
# Get auth token first (from browser dev tools → Application → localStorage → 'supabase.auth.token')
TOKEN="<your_token_here>"

# Verify business creation
curl -X GET "http://localhost:3001/api/business" \
  -H "Authorization: Bearer $TOKEN"
# Expected: Returns business data with id, name, slug, etc.
```

---

### Test 2: Validation - Step 1 (Business Details)

**Objective:** Test field validation on Step 1

**Test 2.1: Empty Business Name**
1. Navigate to `/onboarding`
2. Leave business name empty
3. Enter other required fields
4. Click "Next: Service Area"
5. **Expected:** Error message: "Business name is required"

**Test 2.2: Business Name Too Short**
1. Enter business name: `A` (1 character)
2. Enter other required fields
3. Click "Next: Service Area"
4. **Expected:** Error message: "Business name must be at least 2 characters"

**Test 2.3: Missing Industry**
1. Enter valid business name
2. Leave industry dropdown at default (empty)
3. Enter phone and email
4. Click "Next: Service Area"
5. **Expected:** Error message: "Industry is required"

**Test 2.4: Invalid Phone Format**
1. Enter phone: `invalid-phone`
2. Enter other valid fields
3. Click "Next: Service Area"
4. **Expected:** Error message: "Invalid phone number format"

**Test 2.5: Invalid Email Format**
1. Enter email: `not-an-email`
2. Enter other valid fields
3. Click "Next: Service Area"
4. **Expected:** Error message: "Invalid email format"

---

### Test 3: Validation - Step 2 (Service Area)

**Objective:** Test ZIP code validation

**Test 3.1: No ZIP Codes Entered**
1. Complete Step 1 with valid data
2. On Step 2, do NOT add any ZIP codes
3. Click "Next: Branding"
4. **Expected:** Error message: "Please add at least one ZIP code"

**Test 3.2: Invalid ZIP Code Format**
1. Enter ZIP code: `invalid-zip`
2. Click "Add ZIP Code"
3. **Expected:** Error message: "Please enter a valid 5-digit ZIP code"

**Test 3.3: Invalid ZIP Code Length**
1. Enter ZIP code: `123` (too short)
2. Click "Add ZIP Code"
3. **Expected:** Error message: "Please enter a valid 5-digit ZIP code"

**Test 3.4: Duplicate ZIP Code**
1. Add ZIP code: `77005`
2. Try to add `77005` again
3. **Expected:** Error message: "ZIP code already added"

**Test 3.5: Remove ZIP Code**
1. Add ZIP code: `77005`
2. Add ZIP code: `77030`
3. Click X on `77005` chip
4. **Expected:** `77005` removed, `77030` remains
5. Click "Next: Branding"
6. **Expected:** Proceeds to Step 3 (only 1 ZIP code required)

---

### Test 4: Validation - Step 3 (Branding)

**Objective:** Test logo upload validation

**Test 4.1: Invalid File Type**
1. Click "Choose File"
2. Select a `.txt` or `.pdf` file
3. **Expected:** Error message: "Please select an image file (PNG, JPG, JPEG, GIF, WebP)"

**Test 4.2: File Too Large**
1. Click "Choose File"
2. Select an image file >2MB
3. **Expected:** Error message: "File size must be less than 2MB"

**Test 4.3: Skip Branding (Optional)**
1. Do NOT upload logo
2. Do NOT select color scheme (leave as "Desk.ai Default")
3. Click "Next: Review"
4. **Expected:** Proceeds to Step 4 with default branding

**Test 4.4: Valid Logo Upload**
1. Click "Choose File"
2. Select a valid PNG <500KB
3. **Expected:** Preview shows uploaded image
4. **Expected:** Logo preview displays correctly

---

### Test 5: Navigation & Persistence

**Objective:** Test wizard navigation and localStorage persistence

**Test 5.1: Back Navigation**
1. Complete Step 1 and Step 2
2. On Step 3, click "Back"
3. **Expected:** Returns to Step 2 with ZIP codes preserved
4. Click "Back" again
5. **Expected:** Returns to Step 1 with all fields preserved

**Test 5.2: localStorage Persistence**
1. Complete Step 1
2. Enter some data on Step 2
3. Refresh the browser (F5)
4. **Expected:** Returns to Step 2 with all data preserved
5. Complete wizard and click "Finish Setup"
6. **Expected:** localStorage cleared after successful creation

**Test 5.3: Progress Bar Accuracy**
1. Start wizard at Step 1
2. **Expected:** Progress bar shows "25% Complete"
3. Proceed to Step 2
4. **Expected:** Progress bar shows "50% Complete"
5. Proceed to Step 3
6. **Expected:** Progress bar shows "75% Complete"
7. Proceed to Step 4
8. **Expected:** Progress bar shows "100% Complete"

---

### Test 6: Backend API Endpoint

**Objective:** Test `POST /api/business/create` endpoint directly

**Test 6.1: Successful Business Creation**
```bash
# First, get auth token (signup or login)
TOKEN="<your_supabase_auth_token>"

# Create business
curl -X POST "http://localhost:3001/api/business/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "businessName": "Test Plumbing Co",
    "industry": "plumbing",
    "phone": "+1-555-123-4567",
    "email": "test@plumbing.com",
    "zipCodes": ["77005", "77030"],
    "logoPath": null,
    "colorScheme": "default"
  }'

# Expected Response (201):
{
  "ok": true,
  "message": "Business created successfully",
  "business": {
    "id": "uuid-here",
    "name": "Test Plumbing Co",
    "slug": "test-plumbing-co",
    "industry": "plumbing",
    "phone": "+1-555-123-4567",
    "email": "test@plumbing.com",
    "zipCodes": ["77005", "77030"],
    "logoUrl": null,
    "colorScheme": "default",
    "publicUrl": "http://localhost:3000/b/test-plumbing-co"
  }
}
```

**Test 6.2: Missing Required Fields**
```bash
curl -X POST "http://localhost:3001/api/business/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "businessName": "",
    "industry": "plumbing"
  }'

# Expected Response (400):
{
  "ok": false,
  "error": "Business name is required (minimum 2 characters)",
  "code": "INVALID_BUSINESS_NAME"
}
```

**Test 6.3: Duplicate Business (User Limit)**
```bash
# Create first business (should succeed)
curl -X POST "http://localhost:3001/api/business/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{...valid data...}'

# Try to create second business (should fail in MVP)
curl -X POST "http://localhost:3001/api/business/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{...different valid data...}'

# Expected Response (400):
{
  "ok": false,
  "error": "You already have a business. Multiple businesses not supported in MVP.",
  "code": "BUSINESS_LIMIT_REACHED",
  "existingBusinessId": "uuid-of-first-business"
}
```

**Test 6.4: Unauthorized Request**
```bash
# Try to create business without auth token
curl -X POST "http://localhost:3001/api/business/create" \
  -H "Content-Type: application/json" \
  -d '{...valid data...}'

# Expected Response (401):
{
  "error": "No authorization token provided",
  "code": "NO_TOKEN"
}
```

---

### Test 7: Edge Cases & Error Handling

**Test 7.1: Duplicate Business Slug**
1. Create business named "Houston Plumbing"
2. As different user, create business named "Houston Plumbing"
3. **Expected:** Second business gets slug `houston-plumbing-1`
4. **Expected:** Both businesses created successfully

**Test 7.2: Special Characters in Business Name**
1. Enter business name: `Mike's HVAC & Repair Co.`
2. Complete wizard
3. **Expected:** Slug generated as `mikes-hvac-repair-co`
4. **Expected:** Business created successfully

**Test 7.3: Network Error During Submission**
1. Complete all wizard steps
2. Stop backend server
3. Click "Finish Setup"
4. **Expected:** Error message: "Failed to create business. Please try again."
5. **Expected:** Wizard stays on Step 4 (no redirect)
6. Restart backend server
7. Click "Finish Setup" again
8. **Expected:** Business created successfully

**Test 7.4: Session Expired During Wizard**
1. Start wizard and enter data on Step 1
2. Wait for auth token to expire (or manually clear localStorage)
3. Proceed to Step 2
4. Click "Finish Setup" on Step 4
5. **Expected:** Error message: "Not authenticated"
6. **Expected:** Redirect to login page (optional)

---

### Test 8: Retry Onboarding

**Objective:** Test what happens if user navigates away and comes back

**Test 8.1: Resume Interrupted Onboarding**
1. Start wizard, complete Step 1
2. Navigate away to `/dashboard` (manually in URL bar)
3. Navigate back to `/onboarding`
4. **Expected:** Wizard resumes at Step 2 with Step 1 data preserved

**Test 8.2: Clear Onboarding Data**
1. Start wizard, complete Step 1-2
2. Open browser dev tools → Application → localStorage
3. Find key `desk_ai_onboarding_data`
4. Delete the key
5. Refresh page
6. **Expected:** Wizard restarts at Step 1 with empty fields

**Test 8.3: Access Onboarding After Business Created**
1. Complete full onboarding wizard
2. Business created successfully
3. Navigate to `/onboarding` manually
4. **Expected:** Either:
   - Redirect to `/dashboard` (recommended)
   - OR Show message: "You already have a business"

---

## Database Queries for Verification

### Check Business was Created
```sql
SELECT 
  b.id,
  b.name,
  b.slug,
  b.industry,
  b.phone,
  b.email,
  b.zip_codes,
  b.logo_url,
  b.color_scheme,
  b.is_active,
  b.settings,
  b.created_at
FROM businesses b
WHERE b.name = 'Houston Premier Plumbing';
```

**Expected Result:**
- 1 row returned
- `slug` = `houston-premier-plumbing`
- `industry` = `plumbing`
- `zip_codes` = `["77005", "77030", "77098"]` (JSON array)
- `is_active` = `true`
- `settings` contains default business hours

### Check Business-User Mapping
```sql
SELECT 
  bu.user_id,
  bu.business_id,
  bu.role,
  bu.is_default,
  p.full_name,
  u.email
FROM business_users bu
JOIN profiles p ON bu.user_id = p.id
JOIN auth.users u ON bu.user_id = u.id
WHERE bu.business_id = '<business_id_from_above>';
```

**Expected Result:**
- 1 row returned
- `role` = `owner`
- `is_default` = `true`
- `email` matches signup email

### Check User Has No Other Businesses
```sql
SELECT COUNT(*) as business_count
FROM business_users
WHERE user_id = '<user_id_from_auth>';
```

**Expected Result:**
- `business_count` = `1` (MVP limit)

---

## Troubleshooting Common Issues

### Issue 1: Wizard not redirecting after signup
**Symptom:** After signup, stays on signup page instead of redirecting to `/onboarding`

**Fix:**
1. Check browser console for errors
2. Verify `router.push('/onboarding')` is called in `handleAccountSubmit()`
3. Check Next.js server terminal for errors
4. Clear browser cache and try again

### Issue 2: "Business not found" error on dashboard
**Symptom:** After completing onboarding, dashboard shows "No business found"

**Fix:**
1. Check database: `SELECT * FROM business_users WHERE user_id = '<user_id>'`
2. If no rows, business creation failed - check backend logs
3. If row exists but `is_default = false`, update: `UPDATE business_users SET is_default = true WHERE user_id = '<user_id>'`

### Issue 3: localStorage data not persisting
**Symptom:** Refresh page and wizard data disappears

**Fix:**
1. Check browser console for localStorage quota errors
2. Verify localStorage is enabled (not in private/incognito mode)
3. Check dev tools → Application → localStorage → localhost:3000 → `desk_ai_onboarding_data`

### Issue 4: Duplicate slug errors
**Symptom:** Error: "Slug already exists" when creating business

**Fix:**
1. Backend should auto-append number (`houston-plumbing-1`)
2. If failing, check backend logs for slug generation logic errors
3. Manually verify: `SELECT slug FROM businesses WHERE slug LIKE 'houston-plumbing%'`

### Issue 5: ZIP code validation failing
**Symptom:** Valid ZIP codes rejected with "Invalid format"

**Fix:**
1. Check regex in Step2ServiceArea.js: `/^\d{5}(-\d{4})?$/`
2. Valid formats: `77005` or `77005-1234`
3. Strip whitespace before validation

---

## Success Criteria

All tests should pass with the following criteria:

✅ **Signup Flow**
- User can create account with email/password
- User redirected to `/onboarding` after signup
- Profile created in database

✅ **Wizard Steps**
- All 4 steps render without errors
- Progress bar updates correctly (25% → 50% → 75% → 100%)
- Navigation (Next/Back) works correctly
- Validation errors display appropriately

✅ **Data Persistence**
- localStorage saves wizard data on each step
- Data persists after page refresh
- localStorage cleared after successful submission

✅ **Business Creation**
- Business row created in `businesses` table
- Business-user link created in `business_users` table
- Unique slug generated from business name
- Default settings applied (business hours, timezone)

✅ **Error Handling**
- Required field validation works
- Format validation works (email, phone, ZIP codes)
- Network errors handled gracefully
- Duplicate business prevented (MVP limit)

✅ **Database Integrity**
- User can only have 1 business (MVP)
- Business `is_active = true` by default
- Business-user link has `role = 'owner'` and `is_default = true`
- ZIP codes stored as JSON array

---

## Next Steps After Testing

1. **Test with real users:** Ask 2-3 colleagues to complete onboarding
2. **Monitor backend logs:** Watch for errors during business creation
3. **Verify database state:** Check for orphaned records or missing links
4. **Test edge cases:** Special characters, long names, international phone numbers
5. **Performance test:** Complete wizard with 20+ ZIP codes, large logo files

---

## Rollback Plan (If Needed)

If critical bugs are found:

1. **Disable onboarding wizard:**
   - Revert `/auth/signup.js` to old version (direct business creation)
   - Comment out `/onboarding` route

2. **Database cleanup:**
   ```sql
   -- Remove test businesses
   DELETE FROM businesses WHERE name LIKE '%Test%' OR name LIKE '%Demo%';
   
   -- Remove orphaned business_users links
   DELETE FROM business_users 
   WHERE business_id NOT IN (SELECT id FROM businesses);
   ```

3. **Git revert:**
   ```bash
   git revert <commit-hash-of-onboarding-implementation>
   git push origin main
   ```

---

## Support & Contact

For issues during testing:
- Check backend logs: `frontdesk-backend/logs/`
- Check browser console for frontend errors
- Verify database state in Supabase dashboard
- Reference `ONBOARDING_COMMIT_SUMMARY.md` for implementation details
