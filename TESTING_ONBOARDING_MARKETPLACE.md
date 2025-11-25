# Testing Guide: New Onboarding Flow with Marketplace Fields

## Prerequisites

✅ **Before Testing**:
1. Database migration 008 has been run (see `RUN_MIGRATION_008.md`)
2. Backend running on http://localhost:3001
3. Frontend running on http://localhost:3000
4. Clean test user account (or use new email)

## Test Scenario: Complete Owner Onboarding

### Step 1: Sign Up

1. **Navigate to signup**:
   ```
   http://localhost:3000/auth/signup?role=owner
   ```

2. **Expected UI**:
   - ✅ Clean page with Desk.ai logo
   - ✅ Title: "Create Your Business Owner Account"
   - ✅ NO demo credentials box
   - ✅ NO "demo authentication" text

3. **Create account**:
   - Email: `test-owner-nov24@example.com` (use unique email)
   - Password: `TestPass123!`
   - Confirm password: `TestPass123!`

4. **Expected outcome**:
   - If email confirmation is OFF: Redirect to `/onboarding`
   - If email confirmation is ON: "Check your email" screen

### Step 2: Onboarding - Business Details

1. **Navigate to** (if not auto-redirected):
   ```
   http://localhost:3000/onboarding
   ```

2. **Expected UI**:
   - ✅ Progress bar: "Step 1 of 4"
   - ✅ Title: "Tell us about your business"
   - ✅ Desk.ai logo at top (NOT Growzone - this is product area)

3. **Fill out Step 1**:
   - Business Name: `Test Plumbing Houston`
   - Industry: Select `Plumbing`
   - Phone: `+1-555-123-4567`
   - Email: `contact@testplumbing.com`

4. **Verify slug preview**:
   - Should show: `desk.ai/b/test-plumbing-houston`
   - Blue info box with link icon

5. **Click "Continue"**

### Step 3: Service Area

1. **Expected UI**:
   - Progress bar: "Step 2 of 4"
   - Title: "Where do you serve?"

2. **Add ZIP codes**:
   - Enter: `77001` → Click "Add ZIP"
   - Enter: `77002` → Click "Add ZIP"
   - Enter: `77005` → Click "Add ZIP"

3. **Verify ZIP chips**:
   - Should see 3 chips with X buttons
   - Can remove and re-add

4. **Click "Continue"**

### Step 4: Marketplace Visibility (NEW!)

🎯 **This is the new marketplace feature**

1. **Expected UI**:
   - Progress bar: "Step 3 of 4"
   - Title: "Marketplace Visibility"
   - Large toggle switch (OFF by default)
   - Blue gradient box explaining benefits

2. **Test Private Mode (Default)**:
   - Toggle should be OFF (gray)
   - Should see "Private Mode" info box
   - No tagline/description fields visible
   - **Click "Continue"** - should proceed fine

3. **Go Back and Test Public Mode**:
   - Click "Back" button
   - **Toggle marketplace ON** (should turn blue)
   - Should see new fields appear:
     - Tagline (required, max 60 chars)
     - Short Description (required, max 200 chars)
     - Marketplace Preview card

4. **Fill Marketplace Fields**:
   - Tagline: `Fast, reliable plumbing for Houston homes and businesses`
   - Description: `We're a family-owned plumbing company serving Houston since 2010. We specialize in emergency repairs, installations, and maintenance for residential and commercial properties. Available 24/7 for urgent needs.`

5. **Verify Character Counters**:
   - Tagline: Should show `X/60`
   - Description: Should show `X/200`
   - Try typing more than limit - should stop at max

6. **Check Marketplace Preview**:
   - Should see card with:
     - Business name: "Test Plumbing Houston"
     - Tagline (blue text)
     - Industry badge: "plumbing"
     - Description text
     - Service area: "Serving 77001, 77002, 77005"
     - Blue "Chat with this business" button

7. **Test Validation**:
   - Clear tagline → Click "Continue" → Should show error
   - Enter tagline less than 10 chars → Should show warning
   - Fill valid data → Should proceed

8. **Click "Continue"**

### Step 5: Review & Confirm

1. **Expected UI**:
   - Progress bar: "Step 4 of 4"
   - Title: "Review & Confirm"
   - Summary of all entered data

2. **Verify Data Shows**:
   - Business Name
   - Industry
   - Phone & Email
   - Service ZIP codes
   - **NEW**: Marketplace visibility status
   - **NEW**: Tagline (if public)
   - **NEW**: Description (if public)

3. **Click "Create business & finish setup"**

### Step 6: Dashboard Redirect

1. **Expected**:
   - Redirect to `/dashboard`
   - See welcome message (or leads dashboard if business loaded)

2. **Verify Business Created**:
   - Check database:
   ```sql
   SELECT 
     name, slug, industry, 
     is_public, tagline, short_description,
     service_zip_codes
   FROM businesses 
   WHERE slug = 'test-plumbing-houston';
   ```

3. **Expected Results**:
   - `is_public` = `true`
   - `tagline` = your tagline text
   - `short_description` = your description text
   - `service_zip_codes` = `["77001", "77002", "77005"]`

## Test Scenarios Matrix

### Scenario A: Private Business (Marketplace OFF)

| Field | Value | Expected in DB |
|-------|-------|----------------|
| is_public | false | false |
| tagline | (empty) | null |
| short_description | (empty) | null |

**Result**: Business created but NOT visible in marketplace

### Scenario B: Public Business (Marketplace ON)

| Field | Value | Expected in DB |
|-------|-------|----------------|
| is_public | true | true |
| tagline | "Fast plumbing..." | stored |
| short_description | "We're a family..." | stored |

**Result**: Business created AND visible in marketplace

## Common Issues & Fixes

### Issue: "Column 'is_public' does not exist"

**Cause**: Migration 008 not run  
**Fix**: Run migration from `RUN_MIGRATION_008.md`

### Issue: Can't proceed without tagline even when toggle is OFF

**Cause**: Validation bug  
**Fix**: Check `Step3Branding.js` validateStep() function

### Issue: Backend 400 error on submit

**Cause**: Backend not accepting new fields  
**Fix**: Check `frontdesk-backend/index.js` POST /api/business/create

### Issue: Character counter not showing

**Cause**: React state not updating  
**Fix**: Verify `value` prop is connected to wizard data

## Backend Logging

To debug, check backend logs:

```bash
tail -f /Users/marco/Desktop/agency-mvp/frontdesk-backend/logs/app.log | grep "Onboarding"
```

Look for:
```
[Onboarding] Creating business with slug: "test-plumbing-houston"
[Onboarding] Business created successfully: <uuid>
```

## Database Verification Queries

### Check business was created:
```sql
SELECT * FROM businesses WHERE slug = 'test-plumbing-houston';
```

### Check owner linkage:
```sql
SELECT bu.role, bu.is_default, b.name
FROM business_users bu
JOIN businesses b ON b.id = bu.business_id
WHERE bu.user_id = '<your-user-id>';
```

### List all public businesses:
```sql
SELECT name, slug, tagline, is_public
FROM businesses
WHERE is_public = true;
```

## Success Criteria

✅ **Onboarding Complete** when:
1. User can sign up without seeing demo language
2. User completes all 4 steps
3. Marketplace toggle works (ON/OFF)
4. Validation prevents submission without required fields (when public)
5. Preview card shows accurate data
6. Database stores all new fields correctly
7. User redirects to dashboard
8. Business shows in dashboard

## Next Steps After Testing

1. ✅ Test both private and public flows
2. ✅ Verify database has correct data
3. ✅ Take screenshots for documentation
4. 🔄 Move to marketplace page implementation
5. 🔄 Build public business pages

---

**Test Duration**: ~10 minutes  
**Repeat**: Test with both toggle states  
**Clean Up**: Delete test businesses after testing

## Quick Test Commands

```bash
# Check if servers running
lsof -ti:3001 && echo "Backend OK" || echo "Start backend"
lsof -ti:3000 && echo "Frontend OK" || echo "Start frontend"

# Open onboarding in browser
open http://localhost:3000/auth/signup?role=owner

# Watch backend logs
tail -f /Users/marco/Desktop/agency-mvp/frontdesk-backend/logs/app.log
```
