# Team Management Testing Guide

## Overview

This guide provides step-by-step instructions for testing the new multi-tenant team management functionality with role-based permissions.

---

## Prerequisites

1. **Database Migration**: Run the team_invites migration
   ```sql
   -- In Supabase SQL Editor, run:
   -- migrations/add_team_invites.sql
   ```

2. **Backend Running**: Ensure backend is running on port 3001
   ```bash
   cd frontdesk-backend
   npm run dev
   ```

3. **Frontend Running**: Ensure frontend is running on port 3003
   ```bash
   cd frontend
   npm run dev
   ```

---

## Test Scenario 1: Owner Creates Business & Invites Staff

### Step 1: Create Owner Account A

1. Navigate to http://localhost:3003/get-started
2. Click "I'm a business owner"
3. Sign up with:
   - **Email**: `owner@testbiz.com`
   - **Password**: `TestOwner123!`
4. Complete onboarding wizard:
   - Business Name: "Test Plumbing Co"
   - Industry: "Plumbing"
   - Phone: "555-0100"
   - Email: `contact@testplumbing.com`
   - ZIP Codes: `77001, 77002`
5. ✅ **Verify**: You're redirected to `/dashboard`
6. ✅ **Verify**: Sidebar shows "owner" badge next to business name
7. ✅ **Verify**: Settings and Team links are visible in sidebar

### Step 2: Owner Invites Existing User (Staff Member B)

**Setup**: First create a staff user account

1. Open incognito/private browser window
2. Navigate to http://localhost:3003/get-started
3. Click "I'm a customer"
4. Sign up with:
   - **Email**: `staff@testbiz.com`
   - **Password**: `TestStaff123!`
5. Close incognito window

**Now invite them**:

1. As Owner A, navigate to http://localhost:3003/dashboard/team
2. ✅ **Verify**: "Team Management" page loads
3. ✅ **Verify**: You see yourself listed as "owner"
4. Click "Invite Team Member" button
5. Enter:
   - **Email**: `staff@testbiz.com` (the user we just created)
   - **Role**: Staff
6. Click "Send Invite"
7. ✅ **Verify**: Success message: "Team member added successfully!"
8. ✅ **Verify**: Staff member appears in team list with "staff" role badge
9. ✅ **Verify**: No "Remove" button appears next to your own account

### Step 3: Owner Invites Non-Existent User (Pending Invite)

1. Still as Owner A, click "Invite Team Member"
2. Enter:
   - **Email**: `newstaff@testbiz.com` (does NOT exist yet)
   - **Role**: Staff
3. Click "Send Invite"
4. ✅ **Verify**: Success message: "Invitation created. User will need to sign up first."
5. ✅ **Verify**: Invitation appears in "Pending Invitations" section
6. ✅ **Verify**: Shows email, role badge, and "Awaiting signup" status
7. ✅ **Verify**: Can delete pending invite with X button

---

## Test Scenario 2: Staff Member Logs In

### Step 1: Login as Staff Member B

1. Sign out of Owner A account
2. Navigate to http://localhost:3003/login
3. Login with:
   - **Email**: `staff@testbiz.com`
   - **Password**: `TestStaff123!`
4. ✅ **Verify**: Redirected to `/dashboard`
5. ✅ **Verify**: Sidebar shows "staff" badge next to business name
6. ✅ **Verify**: "Settings" link is NOT visible in sidebar
7. ✅ **Verify**: "Team" link is NOT visible in sidebar
8. ✅ **Verify**: Dashboard, Leads, Calendar links ARE visible

### Step 2: Staff Attempts to Access Restricted Pages

**Test Settings Page**:
1. Manually navigate to http://localhost:3003/dashboard/settings
2. ✅ **Verify**: Immediately redirected to `/dashboard`

**Test Team Page**:
1. Manually navigate to http://localhost:3003/dashboard/team
2. ✅ **Verify**: Immediately redirected to `/dashboard`

### Step 3: Staff Can Access Allowed Pages

**Test Dashboard**:
1. Navigate to http://localhost:3003/dashboard
2. ✅ **Verify**: Page loads successfully
3. ✅ **Verify**: Shows business stats

**Test Leads Page**:
1. Navigate to http://localhost:3003/dashboard/leads
2. ✅ **Verify**: Page loads successfully
3. ✅ **Verify**: Can view leads for the business

**Test Calendar Page**:
1. Navigate to http://localhost:3003/dashboard/calendar
2. ✅ **Verify**: Page loads successfully
3. ✅ **Verify**: Can view appointments

---

## Test Scenario 3: API Permission Enforcement

### Step 1: Staff Tries to Invite Team Member (Should Fail)

1. Open browser developer tools (F12)
2. Go to Console tab
3. Run this command:
```javascript
fetch('http://localhost:3001/api/business/[BUSINESS_ID]/invite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email: 'hacker@test.com', role: 'owner' })
}).then(r => r.json()).then(console.log)
```

4. ✅ **Verify**: Response: `{ok: false, error: "Only owners can invite team members", code: "INSUFFICIENT_PERMISSIONS"}`

### Step 2: Staff Tries to Update Business Settings (Should Fail)

```javascript
fetch('http://localhost:3001/api/business/[BUSINESS_ID]', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ is_listed: true })
}).then(r => r.json()).then(console.log)
```

✅ **Verify**: Response: `{ok: false, error: "Only owners can update business settings", code: "INSUFFICIENT_PERMISSIONS"}`

### Step 3: Staff Tries to Remove Team Member (Should Fail)

```javascript
fetch('http://localhost:3001/api/business/[BUSINESS_ID]/team/[USER_ID]', {
  method: 'DELETE',
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

✅ **Verify**: Response: `{ok: false, error: "Only owners can remove team members", code: "INSUFFICIENT_PERMISSIONS"}`

---

## Test Scenario 4: Owner Removes Staff Member

### Step 1: Owner Removes Staff

1. Login as Owner A (`owner@testbiz.com`)
2. Navigate to http://localhost:3003/dashboard/team
3. Find staff member `staff@testbiz.com`
4. Click the trash icon next to their name
5. Confirm the removal dialog
6. ✅ **Verify**: Success message: "Team member removed successfully"
7. ✅ **Verify**: Staff member no longer appears in list

### Step 2: Verify Staff Member Loses Access

1. Sign out, login as Staff B (`staff@testbiz.com`)
2. Navigate to http://localhost:3003/dashboard
3. ✅ **Verify**: Shows "No business assigned" or redirected to onboarding
4. ✅ **Verify**: Cannot access any business data

---

## Test Scenario 5: Pending Invite Conversion

### Step 1: New User Signs Up with Invited Email

1. Owner A has pending invite for `newstaff@testbiz.com`
2. Open incognito window
3. Navigate to http://localhost:3003/get-started
4. Sign up as customer with:
   - **Email**: `newstaff@testbiz.com`
   - **Password**: `NewStaff123!`
5. ✅ **Verify**: User is created

### Step 2: Verify Pending Invite Still Exists

1. As Owner A, check team page
2. ✅ **Verify**: Pending invite still shows (auto-conversion not implemented)
3. **Note**: In production, you'd implement a signup hook to auto-convert invites

---

## Test Scenario 6: Multiple Businesses

### Step 1: Owner Has Multiple Businesses

**Setup**: Create second business
1. In Supabase SQL Editor:
```sql
INSERT INTO businesses (id, slug, name, industry, phone, email, is_active)
VALUES (gen_random_uuid(), 'test-hvac', 'Test HVAC Co', 'HVAC', '555-0200', 'contact@testhvac.com', true);

-- Get the business ID, then link owner
INSERT INTO business_users (business_id, user_id, role, is_default)
VALUES ('[BUSINESS_ID]', '[OWNER_USER_ID]', 'owner', false);
```

2. Refresh dashboard
3. ✅ **Verify**: Business selector appears in sidebar
4. ✅ **Verify**: Can switch between businesses
5. ✅ **Verify**: Team page shows different team members per business

---

## Test Scenario 7: Edge Cases

### Edge Case 1: Owner Cannot Remove Themselves

1. As Owner A, navigate to team page
2. ✅ **Verify**: Your own account has NO trash icon
3. **Optional**: Try via API:
```javascript
fetch('http://localhost:3001/api/business/[BUSINESS_ID]/team/[YOUR_USER_ID]', {
  method: 'DELETE',
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```
4. ✅ **Verify**: Error: "You cannot remove yourself from the team"

### Edge Case 2: Cannot Invite Duplicate Email

1. As Owner A, try to invite `staff@testbiz.com` again
2. ✅ **Verify**: Error: "User is already a team member of this business"

### Edge Case 3: Cannot Invite Same Pending Email Twice

1. Create pending invite for `test@example.com`
2. Try to invite `test@example.com` again
3. ✅ **Verify**: Error: "An invitation has already been sent to this email"

---

## Test Scenario 8: UI/UX Verification

### Visual Checks

1. **Sidebar**:
   - ✅ Owner sees: Dashboard, Leads, Calendar, Team, Settings
   - ✅ Staff sees: Dashboard, Leads, Calendar (no Team, no Settings)
   - ✅ Role badge displays correctly (purple for owner, blue for staff)

2. **Team Page**:
   - ✅ Desk.ai card design
   - ✅ Icons (Users, Clock, Mail)
   - ✅ Role badges with correct colors
   - ✅ Demo notice: "These invites are for demo/testing only"
   - ✅ Success/error messages display properly
   - ✅ Modal centers on screen, has backdrop

3. **Responsive Design**:
   - ✅ Test on mobile width (< 768px)
   - ✅ Sidebar collapses
   - ✅ Team page is mobile-friendly
   - ✅ Modal is mobile-friendly

---

## Test Scenario 9: Database Verification

### Verify Data Integrity

In Supabase SQL Editor:

**Check business_users table**:
```sql
SELECT bu.*, p.email, b.name as business_name
FROM business_users bu
JOIN profiles p ON p.id = bu.user_id
JOIN businesses b ON b.id = bu.business_id
WHERE b.slug = 'test-plumbing-co';
```

✅ **Verify**: Shows owner and staff with correct roles

**Check team_invites table**:
```sql
SELECT * FROM team_invites
WHERE business_id = '[BUSINESS_ID]';
```

✅ **Verify**: Shows pending invites with expiration dates

**Check RLS policies work**:
```sql
-- As owner user (use their JWT)
SELECT * FROM team_invites WHERE business_id = '[BUSINESS_ID]';
-- Should return invites

-- As staff user (use their JWT)  
SELECT * FROM team_invites WHERE business_id = '[BUSINESS_ID]';
-- Should return nothing (RLS blocks)
```

---

## Checklist Summary

### Backend API
- [ ] POST /api/business/:businessId/invite - Owner only
- [ ] GET /api/business/:businessId/team - All members can view
- [ ] DELETE /api/business/:businessId/team/:userId - Owner only
- [ ] DELETE /api/business/:businessId/invite/:inviteId - Owner only
- [ ] PATCH /api/business/:businessId - Owner only
- [ ] All endpoints verify business ownership
- [ ] All endpoints return proper error codes (401, 403, 400)

### Frontend Pages
- [ ] /dashboard/team - Owner only (redirects staff)
- [ ] /dashboard/settings - Owner only (redirects staff)
- [ ] /dashboard - All roles
- [ ] /dashboard/leads - All roles
- [ ] /dashboard/calendar - All roles

### UI Components
- [ ] Sidebar shows role badge
- [ ] Sidebar filters links by role
- [ ] Team page lists active members
- [ ] Team page lists pending invites
- [ ] Invite modal works correctly
- [ ] Success/error messages display
- [ ] Confirmation dialogs work

### Database
- [ ] team_invites table created
- [ ] RLS policies enforce ownership
- [ ] Invites expire after 7 days
- [ ] business_users.role constraint works
- [ ] Can query team data correctly

### Permissions
- [ ] Staff cannot access settings
- [ ] Staff cannot access team management
- [ ] Staff cannot invite members
- [ ] Staff cannot remove members
- [ ] Staff cannot update business
- [ ] Staff CAN view leads
- [ ] Staff CAN view calendar
- [ ] Staff CAN view dashboard

---

## Common Issues & Troubleshooting

### Issue: "Table team_invites does not exist"
**Solution**: Run the migration `migrations/add_team_invites.sql` in Supabase

### Issue: Staff can still see Settings link
**Solution**: Clear browser cache, ensure userRole is in AuthContext

### Issue: Cannot invite anyone
**Solution**: Ensure you're logged in as owner, check browser console for errors

### Issue: RLS blocks all queries
**Solution**: Ensure service_role_key is used for admin operations, anon key for user operations

### Issue: Invite appears but user can't access business
**Solution**: Check business_users table, ensure row was created with correct business_id

---

## Performance Testing

### Load Test: Team Page

1. Create 20 team members (via SQL)
2. Navigate to team page
3. ✅ **Verify**: Page loads in < 2 seconds
4. ✅ **Verify**: All members display correctly

### Load Test: API Response Times

```bash
# Test team list endpoint
time curl -H "Authorization: Bearer [TOKEN]" \
  http://localhost:3001/api/business/[BUSINESS_ID]/team

# Should return in < 500ms
```

---

## Security Testing

### Test 1: JWT Token Required

```bash
curl http://localhost:3001/api/business/test/team
# Should return 401 Unauthorized
```

### Test 2: Cannot Access Other Business

1. Get business ID of another business
2. Try to access with your token:
```javascript
fetch('http://localhost:3001/api/business/[OTHER_BUSINESS_ID]/team', {
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```
3. ✅ **Verify**: 403 Forbidden

### Test 3: XSS Protection

1. Try to invite email: `<script>alert('xss')</script>@test.com`
2. ✅ **Verify**: Email validation prevents this

---

**Last Updated**: November 24, 2025  
**Status**: Ready for testing  
**Prerequisites**: Database migration must be run first
