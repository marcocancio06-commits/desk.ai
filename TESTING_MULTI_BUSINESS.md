# Step 6: Multi-Business Support - Testing Guide

Complete testing checklist for business linking and multi-business owner support.

---

## Prerequisites

✅ **Step 5 (Authentication) completed**
- Users can signup and login
- Business is created on signup
- Session management works

✅ **Backend running**
```bash
cd frontdesk-backend
npm run dev
# Should be at http://localhost:3001
```

✅ **Frontend running**
```bash
cd frontend
npm run dev
# Should be at http://localhost:3000
```

---

## Test 1: Single Business Owner (Baseline)

### 1.1 Create First Owner

**Steps:**
1. Go to `http://localhost:3000/auth/signup`
2. Sign up with:
   - Email: `owner1@example.com`
   - Password: `password123`
   - Business name: `Houston Premier Plumbing`
   - Industry: `Plumbing`
   - Phone: `+1-713-555-0100`
   - ZIP codes: `77005, 77030, 77098`
3. Click "Create Account"

**Expected:**
- ✅ Redirect to `/dashboard`
- ✅ Sidebar shows: "Houston Premier Plumbing"
- ✅ No business selector visible (only 1 business)

### 1.2 Verify Dashboard Data Isolation

**Steps:**
1. Navigate to `/dashboard/leads`
2. Note the number of leads shown
3. Navigate to `/dashboard/calendar`
4. Note appointments shown

**Expected:**
- ✅ Only sees leads for "Houston Premier Plumbing"
- ✅ Only sees appointments for their business
- ✅ No data from other businesses

### 1.3 Check Settings Page

**Steps:**
1. Navigate to `/dashboard/settings`
2. Check business selector

**Expected:**
- ✅ No business selector dropdown (only 1 business)
- ✅ Business info shows: "Houston Premier Plumbing"
- ✅ Team Management section visible
- ✅ "Invite Team Member" button visible

---

## Test 2: Multi-Business Owner (Manual SQL)

### 2.1 Create Second Business via SQL

**Get user ID:**
```sql
SELECT id, email FROM auth.users WHERE email = 'owner1@example.com';
-- Copy the user ID (UUID)
```

**Create second business:**
```sql
-- Create business
INSERT INTO businesses (slug, name, phone, industry, service_zip_codes, is_active)
VALUES (
  'houston-hvac-pros',
  'Houston HVAC Pros',
  '+1-713-555-0200',
  'hvac',
  ARRAY['77019', '77027', '77056'],
  true
)
RETURNING id;
-- Copy the business ID
```

**Link user to second business:**
```sql
INSERT INTO business_users (user_id, business_id, role, is_default)
VALUES (
  '<user_id>',  -- Replace with actual user ID from step 1
  '<business_id>',  -- Replace with business ID from step 2
  'owner',
  false  -- Not default
);
```

**Verify mapping:**
```sql
SELECT 
  bu.user_id,
  bu.role,
  bu.is_default,
  b.name as business_name
FROM business_users bu
JOIN businesses b ON b.id = bu.business_id
WHERE bu.user_id = '<user_id>';

-- Expected: 2 rows (Houston Premier Plumbing and Houston HVAC Pros)
```

### 2.2 Verify Business Selector Appears

**Steps:**
1. Refresh the dashboard page
2. Check sidebar

**Expected:**
- ✅ Business selector dropdown appears in sidebar
- ✅ Dropdown shows both businesses:
  - Houston Premier Plumbing (default, selected)
  - Houston HVAC Pros
- ✅ Current business name shown: "Houston Premier Plumbing"

### 2.3 Switch Between Businesses

**Test switching to second business:**
1. Click business selector dropdown
2. Select "Houston HVAC Pros"

**Expected:**
- ✅ Sidebar updates to show: "Houston HVAC Pros"
- ✅ Page doesn't reload (smooth transition)
- ✅ Console log: "Switching to business: Houston HVAC Pros"
- ✅ localStorage updated:
  ```javascript
  localStorage.getItem('currentBusinessId')
  // Should be UUID of Houston HVAC Pros
  ```

**Test switching back:**
1. Click business selector dropdown
2. Select "Houston Premier Plumbing"

**Expected:**
- ✅ Sidebar updates to show: "Houston Premier Plumbing"
- ✅ localStorage updated to Premier Plumbing ID

---

## Test 3: Data Isolation Verification

### 3.1 Create Test Data for Each Business

**For Houston Premier Plumbing:**
```sql
-- Get business ID
SELECT id FROM businesses WHERE slug = 'houston-premier-plumbing';

-- Create test lead
INSERT INTO leads (business_id, phone, status, issue_summary, zip_code)
VALUES (
  '<premier_plumbing_business_id>',
  '+1-555-0001',
  'qualified',
  'Leaking pipe in kitchen',
  '77005'
);
```

**For Houston HVAC Pros:**
```sql
-- Get business ID
SELECT id FROM businesses WHERE slug = 'houston-hvac-pros';

-- Create test lead
INSERT INTO leads (business_id, phone, status, issue_summary, zip_code)
VALUES (
  '<hvac_pros_business_id>',
  '+1-555-0002',
  'qualified',
  'AC not cooling',
  '77019'
);
```

### 3.2 Verify Dashboard Shows Correct Data

**View Houston Premier Plumbing:**
1. Select "Houston Premier Plumbing" from business selector
2. Navigate to `/dashboard/leads`
3. Note leads shown

**Expected:**
- ✅ URL includes: `?businessId=<premier_plumbing_id>`
- ✅ Shows lead: "Leaking pipe in kitchen"
- ✅ Does NOT show: "AC not cooling"

**View Houston HVAC Pros:**
1. Select "Houston HVAC Pros" from business selector
2. Navigate to `/dashboard/leads`
3. Note leads shown

**Expected:**
- ✅ URL includes: `?businessId=<hvac_pros_id>`
- ✅ Shows lead: "AC not cooling"
- ✅ Does NOT show: "Leaking pipe in kitchen"

### 3.3 Verify Calendar Data Isolation

**Same test for appointments:**
1. Create appointment for each business
2. Switch between businesses
3. Verify only relevant appointments show

**SQL to create test appointments:**
```sql
-- For Premier Plumbing
INSERT INTO appointments (lead_id, scheduled_date, scheduled_time, status)
VALUES (
  <lead_id_from_premier_plumbing>,
  '2025-11-25',
  '10:00',
  'pending'
);

-- For HVAC Pros
INSERT INTO appointments (lead_id, scheduled_date, scheduled_time, status)
VALUES (
  <lead_id_from_hvac_pros>,
  '2025-11-25',
  '14:00',
  'pending'
);
```

**Expected:**
- ✅ Switching businesses shows different appointments
- ✅ No cross-contamination of data

---

## Test 4: Business Selector in Settings

### 4.1 Settings Page Business Selector

**Steps:**
1. Navigate to `/dashboard/settings`
2. Check for business selector in header

**Expected:**
- ✅ Business selector dropdown visible in top-right
- ✅ Label: "Viewing Settings For:"
- ✅ Shows both businesses in dropdown
- ✅ Currently selected business highlighted

### 4.2 Switch Business from Settings

**Steps:**
1. On `/dashboard/settings`, select "Houston HVAC Pros" from dropdown
2. Check business info section

**Expected:**
- ✅ Business info updates to show:
  - Name: "Houston HVAC Pros"
  - Phone: "+1-713-555-0200"
  - Service Areas: ["77019", "77027", "77056"]
- ✅ Team members for HVAC Pros shown (if any)
- ✅ Settings reload for new business

### 4.3 Verify Persistence

**Steps:**
1. Switch to "Houston HVAC Pros"
2. Navigate to `/dashboard/leads`
3. Refresh page

**Expected:**
- ✅ Still on "Houston HVAC Pros" (localStorage persisted)
- ✅ Leads for HVAC Pros shown
- ✅ Business selector shows HVAC Pros selected

---

## Test 5: Team Member Invitation

### 5.1 Invite New Team Member

**Steps:**
1. Login as `owner1@example.com`
2. Select "Houston Premier Plumbing"
3. Navigate to `/dashboard/settings`
4. Click "Invite Team Member" button
5. Fill form:
   - Email: `staff1@example.com`
   - Role: `Staff`
6. Click "Send Invite"

**Expected:**
- ✅ Modal shows loading state "Sending..."
- ✅ Success message: "Team member invited successfully!"
- ✅ Modal closes
- ✅ Team member appears in list
- ✅ Shows: Email, Role badge

### 5.2 Verify Team Member in Database

**SQL verification:**
```sql
-- Check user created
SELECT id, email FROM auth.users WHERE email = 'staff1@example.com';

-- Check business_users mapping
SELECT 
  bu.role,
  bu.is_default,
  b.name as business_name
FROM business_users bu
JOIN businesses b ON b.id = bu.business_id
WHERE bu.user_id = (
  SELECT id FROM auth.users WHERE email = 'staff1@example.com'
);

-- Expected: 1 row, role='staff', business='Houston Premier Plumbing'
```

### 5.3 Invite Manager Role

**Steps:**
1. Click "Invite Team Member"
2. Fill form:
   - Email: `manager1@example.com`
   - Role: `Manager`
3. Click "Send Invite"

**Expected:**
- ✅ Success message
- ✅ Manager appears in team list with "Manager" badge
- ✅ Badge color different from Staff (blue vs gray)

### 5.4 Test Duplicate Invitation

**Steps:**
1. Try to invite `staff1@example.com` again for same business
2. Click "Send Invite"

**Expected:**
- ✅ Error message: "User is already a team member of this business"
- ✅ No duplicate created in database

### 5.5 Invite Same User to Different Business

**Steps:**
1. Switch to "Houston HVAC Pros"
2. Click "Invite Team Member"
3. Email: `staff1@example.com`
4. Role: `Staff`
5. Click "Send Invite"

**Expected:**
- ✅ Success (same user can be team member of multiple businesses)
- ✅ User appears in HVAC Pros team list

**SQL verification:**
```sql
SELECT 
  bu.role,
  b.name as business_name
FROM business_users bu
JOIN businesses b ON b.id = bu.business_id
WHERE bu.user_id = (
  SELECT id FROM auth.users WHERE email = 'staff1@example.com'
);

-- Expected: 2 rows (one for each business)
```

---

## Test 6: Team Member Login (Future)

**Note:** This test validates the invitation worked, even though full onboarding isn't built yet.

### 6.1 Team Member Can Login

**Steps:**
1. Go to `/auth/login`
2. Email: `staff1@example.com`
3. Password: (use password reset or check Supabase)
4. Login

**Expected:**
- ✅ Login successful
- ✅ Redirect to dashboard
- ✅ Can see businesses they're linked to

---

## Test 7: LocalStorage Persistence

### 7.1 Test Browser Refresh

**Steps:**
1. Select "Houston HVAC Pros"
2. Press `Cmd+R` or `F5`

**Expected:**
- ✅ Page reloads
- ✅ Still on "Houston HVAC Pros"
- ✅ Business selector shows HVAC Pros
- ✅ Dashboard data for HVAC Pros shown

### 7.2 Test New Tab

**Steps:**
1. Select "Houston HVAC Pros" in current tab
2. Open new tab
3. Go to `http://localhost:3000/dashboard`

**Expected:**
- ✅ Dashboard loads with "Houston HVAC Pros" selected
- ✅ Same business context as other tab

### 7.3 Test Browser Restart

**Steps:**
1. Select "Houston HVAC Pros"
2. Close all browser windows
3. Reopen browser
4. Go to `http://localhost:3000/dashboard`

**Expected:**
- ✅ Login still active (session persisted)
- ✅ "Houston HVAC Pros" still selected
- ✅ localStorage.currentBusinessId preserved

---

## Test 8: Edge Cases

### 8.1 No Businesses (Edge Case)

**Setup:**
Remove all business_users mappings for a user:
```sql
DELETE FROM business_users WHERE user_id = '<user_id>';
```

**Expected:**
- ✅ Dashboard shows empty state
- ✅ Sidebar shows "Loading..." or appropriate message
- ✅ No errors/crashes

### 8.2 Switch Business Mid-Operation

**Steps:**
1. Start creating a lead on Business A
2. Switch to Business B mid-form
3. Complete form submission

**Expected:**
- ✅ Lead created for Business B (not Business A)
- ✅ No data corruption

### 8.3 Deleted Business

**Setup:**
```sql
UPDATE businesses 
SET is_active = false 
WHERE slug = 'houston-hvac-pros';
```

**Expected:**
- ✅ Business still shows in selector
- ✅ Can switch to it (but may show "inactive" notice)
- ✅ No crashes

---

## Test 9: Backend API Verification

### 9.1 Test GET /api/business/:businessId/team

**Request:**
```bash
curl http://localhost:3001/api/business/<business_id>/team
```

**Expected Response:**
```json
{
  "ok": true,
  "data": [
    {
      "user_id": "uuid",
      "email": "owner1@example.com",
      "role": "owner",
      "is_default": true,
      "full_name": "...",
      "phone": "...",
      "created_at": "..."
    },
    {
      "user_id": "uuid",
      "email": "staff1@example.com",
      "role": "staff",
      "is_default": false,
      "full_name": null,
      "phone": null,
      "created_at": "..."
    }
  ]
}
```

### 9.2 Test POST /api/business/:businessId/invite

**Request:**
```bash
curl -X POST http://localhost:3001/api/business/<business_id>/invite \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newstaff@example.com",
    "role": "staff"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "message": "Team member invited successfully",
  "userId": "uuid"
}
```

### 9.3 Test API with businessId Query Parameter

**Request:**
```bash
# Test leads endpoint with businessId
curl http://localhost:3001/api/leads?businessId=<business_id>
```

**Expected:**
- ✅ Returns only leads for specified business
- ✅ No cross-business data

---

## Test 10: UI/UX Verification

### 10.1 Business Selector Visual States

**Check:**
- ✅ Dropdown opens on click
- ✅ Hover states work
- ✅ Selected business highlighted
- ✅ Font sizes readable
- ✅ Mobile responsive

### 10.2 Team Management UI

**Check:**
- ✅ "Invite Team Member" button prominent
- ✅ Modal opens smoothly
- ✅ Form validation works
- ✅ Success messages clear
- ✅ Error messages helpful
- ✅ Team member cards well-designed
- ✅ Role badges color-coded

### 10.3 Settings Page Layout

**Check:**
- ✅ Business selector doesn't overlap content
- ✅ Responsive on mobile
- ✅ All sections load correctly
- ✅ No horizontal scrolling

---

## Success Criteria Checklist

### ✅ Multi-Business Support
- [ ] User can own multiple businesses
- [ ] Business selector appears when >1 business
- [ ] Switching businesses works smoothly
- [ ] Selection persists in localStorage
- [ ] Selection persists across page refreshes

### ✅ Data Isolation
- [ ] Leads filtered by current business
- [ ] Appointments filtered by current business
- [ ] Settings load for current business
- [ ] No cross-contamination between businesses
- [ ] URL includes businessId parameter

### ✅ Team Management
- [ ] Invite team member button works
- [ ] Can invite staff and managers
- [ ] Team members appear in list
- [ ] Backend creates user if not exists
- [ ] Backend links user to business
- [ ] Duplicate invites rejected
- [ ] Same user can join multiple businesses

### ✅ Backend APIs
- [ ] GET /api/business/:businessId/team works
- [ ] POST /api/business/:businessId/invite works
- [ ] All data queries include businessId filter
- [ ] Authentication still works

### ✅ User Experience
- [ ] UI is intuitive
- [ ] No console errors
- [ ] Loading states shown
- [ ] Error messages helpful
- [ ] Mobile responsive

---

## Troubleshooting

### Issue: Business selector doesn't appear

**Symptoms:**
- User has multiple businesses but no selector shown

**Solutions:**
1. Check `businesses` array in AuthContext:
   ```javascript
   const { businesses } = useAuth();
   console.log('Businesses:', businesses);
   ```
2. Verify database query returns multiple businesses
3. Check console for errors loading businesses

### Issue: Switching business doesn't update data

**Symptoms:**
- Selector changes but dashboard shows same data

**Solutions:**
1. Check if `currentBusiness` is updated in AuthContext
2. Verify `useEffect` dependencies include `currentBusiness`
3. Check if `getCurrentBusinessId()` returns correct ID
4. Verify API calls include `businessId` parameter

### Issue: Team invitation fails

**Symptoms:**
- Error message when inviting team member

**Solutions:**
1. Check backend logs for specific error
2. Verify Supabase permissions allow user creation
3. Check if email is valid format
4. Verify business_users table allows inserts

### Issue: Data bleeding between businesses

**Symptoms:**
- See leads from Business A when viewing Business B

**Solutions:**
1. Check SQL queries include `WHERE business_id = ?`
2. Verify `getCurrentBusinessId()` returns correct ID
3. Check if backend properly filters by businessId
4. Clear localStorage and re-login

---

## Manual Testing Completion

**Tester:** _______________
**Date:** _______________
**Tests Passed:** ___ / ___
**Issues Found:** _______________

---

## Next Steps

After completing all tests:

1. ✅ Document any bugs found
2. ✅ Fix critical issues
3. ✅ Re-test failed scenarios
4. ✅ Mark Step 6 (Multi-Business Support) as complete
5. ✅ Commit all changes with detailed summary

---

## SQL Helper Queries

### Create Test Business
```sql
INSERT INTO businesses (slug, name, phone, industry, service_zip_codes, is_active)
VALUES (
  'test-business-slug',
  'Test Business Name',
  '+1-555-555-5555',
  'plumbing',
  ARRAY['77001', '77002'],
  true
)
RETURNING id;
```

### Link User to Business
```sql
INSERT INTO business_users (user_id, business_id, role, is_default)
VALUES (
  '<user_id>',
  '<business_id>',
  'owner',
  false
);
```

### View All Businesses for User
```sql
SELECT 
  b.id,
  b.name,
  b.slug,
  bu.role,
  bu.is_default
FROM business_users bu
JOIN businesses b ON b.id = bu.business_id
WHERE bu.user_id = '<user_id>';
```

### View All Team Members for Business
```sql
SELECT 
  bu.user_id,
  bu.role,
  bu.is_default,
  au.email
FROM business_users bu
JOIN auth.users au ON au.id = bu.user_id
WHERE bu.business_id = '<business_id>';
```

### Cleanup Test Data
```sql
-- Remove team member
DELETE FROM business_users 
WHERE user_id = '<user_id>' AND business_id = '<business_id>';

-- Remove business
DELETE FROM businesses WHERE id = '<business_id>';

-- Remove user (use Supabase dashboard for auth.users)
```
