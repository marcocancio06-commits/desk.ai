# Authentication Testing Guide

Complete testing checklist for the owner authentication system (Step 5).

---

## Prerequisites

Before testing, ensure:

✅ **Supabase is configured**
- Environment variables set in `frontend/.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

✅ **Database migration applied**
- Run migration 007 if not already applied
- Tables should exist: `businesses`, `profiles`, `business_users`

✅ **Frontend is running**
```bash
cd frontend
npm run dev
# Should be at http://localhost:3000
```

---

## Test 1: Signup Flow

### 1.1 Navigate to Signup Page
```
URL: http://localhost:3000/auth/signup
```

**Expected:**
- ✅ Desk.ai logo displayed
- ✅ "Create Your Desk.ai Account" heading
- ✅ Two-step progress indicator (Account → Business)
- ✅ Link to login page

### 1.2 Test Validation (Step 1 - Account)

**Test Case: Empty email**
1. Leave email empty
2. Enter password: `testpass123`
3. Confirm password: `testpass123`
4. Click "Continue to Business Info"

**Expected:**
- ✅ Browser validation error "Please fill out this field"

**Test Case: Weak password**
1. Email: `test@example.com`
2. Password: `12345` (only 5 characters)
3. Confirm password: `12345`
4. Click "Continue"

**Expected:**
- ✅ Error message: "Password must be at least 6 characters"

**Test Case: Password mismatch**
1. Email: `test@example.com`
2. Password: `password123`
3. Confirm password: `password456`
4. Click "Continue"

**Expected:**
- ✅ Error message: "Passwords do not match"

**Test Case: Valid account info**
1. Email: `owner@demolishing.com`
2. Password: `password123`
3. Confirm password: `password123`
4. Click "Continue"

**Expected:**
- ✅ Progress indicator updates (step 2 active)
- ✅ Business info form appears
- ✅ "Back" button available

### 1.3 Test Validation (Step 2 - Business)

**Test Case: Missing required fields**
1. Leave business name empty
2. Click "Create Account"

**Expected:**
- ✅ Browser validation error

**Test Case: Invalid ZIP codes**
1. Business name: `Houston Demo Plumbing`
2. Phone: `+1-713-555-0100`
3. ZIP codes: ` ` (empty/whitespace)
4. Click "Create Account"

**Expected:**
- ✅ Error message: "Please enter at least one ZIP code"

**Test Case: Complete signup**
1. Business name: `Houston Demo Plumbing`
2. Industry: `Plumbing` (dropdown)
3. Phone: `+1-713-555-0100`
4. ZIP codes: `77005, 77030, 77098`
5. Click "Create Account"

**Expected:**
- ✅ Button shows loading state with spinner
- ✅ Button text changes to "Creating Account..."
- ✅ Console logs:
  ```
  Creating auth user...
  Auth user created: <user_id>
  Creating business...
  Business created: <business_id>
  Creating business-user mapping...
  Business-user mapping created
  ✅ Signup complete
  ```
- ✅ Redirect to `/dashboard`
- ✅ Dashboard loads successfully

### 1.4 Verify Database Records

**Check auth.users table** (Supabase Dashboard → Authentication → Users)
```
Expected:
- Email: owner@demolishing.com
- Email Confirmed: Yes (or check inbox for confirmation email)
- User ID: <uuid>
```

**Check businesses table:**
```sql
SELECT id, slug, name, phone, service_zip_codes, subscription_tier
FROM businesses
WHERE name = 'Houston Demo Plumbing';
```

**Expected:**
```
id:                  <uuid>
slug:                houston-demo-plumbing
name:                Houston Demo Plumbing
phone:               +1-713-555-0100
service_zip_codes:   ["77005", "77030", "77098"]
subscription_tier:   trial
```

**Check business_users table:**
```sql
SELECT bu.*, b.name as business_name
FROM business_users bu
JOIN businesses b ON b.id = bu.business_id
WHERE bu.user_id = '<user_id_from_above>';
```

**Expected:**
```
user_id:      <user_id>
business_id:  <business_id>
role:         owner
is_default:   true
business_name: Houston Demo Plumbing
```

**Check profiles table:**
```sql
SELECT * FROM profiles WHERE id = '<user_id>';
```

**Expected:**
```
id:         <user_id>
full_name:  Houston Demo Plumbing Owner (or similar)
phone:      +1-713-555-0100
```

---

## Test 2: Login Flow

### 2.1 Log Out First
1. In dashboard, click "Log Out" button in sidebar (bottom)
2. Verify redirect to `/auth/login`

### 2.2 Navigate to Login Page
```
URL: http://localhost:3000/auth/login
```

**Expected:**
- ✅ Desk.ai logo displayed
- ✅ "Sign in to Desk.ai" heading
- ✅ Link to signup page
- ✅ Demo credentials shown at bottom

### 2.3 Test Login Validation

**Test Case: Invalid credentials**
1. Email: `owner@demolishing.com`
2. Password: `wrongpassword`
3. Click "Sign in"

**Expected:**
- ✅ Error message: "Invalid email or password"
- ✅ Form remains editable

**Test Case: Nonexistent user**
1. Email: `nonexistent@example.com`
2. Password: `anything123`
3. Click "Sign in"

**Expected:**
- ✅ Error message: "Invalid email or password"

**Test Case: Successful login**
1. Email: `owner@demolishing.com`
2. Password: `password123`
3. Click "Sign in"

**Expected:**
- ✅ Button shows loading state with spinner
- ✅ Button text changes to "Signing in..."
- ✅ Console logs:
  ```
  Signing in... owner@demolishing.com
  ✅ Login successful
  ```
- ✅ Redirect to `/dashboard`

---

## Test 3: Session Persistence

### 3.1 Refresh Test
1. While logged in at `/dashboard`, press `Cmd+R` (or `F5`)

**Expected:**
- ✅ Page reloads
- ✅ User remains logged in
- ✅ Dashboard content loads
- ✅ No redirect to login

### 3.2 New Tab Test
1. While logged in, open new tab
2. Navigate to `http://localhost:3000/dashboard`

**Expected:**
- ✅ Dashboard loads immediately
- ✅ No login required
- ✅ Business name shown in sidebar

### 3.3 Browser Restart Test
1. While logged in, close all browser windows
2. Reopen browser
3. Navigate to `http://localhost:3000/dashboard`

**Expected:**
- ✅ Dashboard loads (session persisted)
- ✅ User still logged in

---

## Test 4: Route Protection

### 4.1 Test Protected Routes (Logged Out)

**Logout first:**
1. Click "Log Out" in sidebar
2. Verify redirect to `/auth/login`

**Try accessing protected routes:**
```
http://localhost:3000/dashboard
http://localhost:3000/dashboard/leads
http://localhost:3000/dashboard/calendar
http://localhost:3000/dashboard/settings
```

**Expected for ALL:**
- ✅ Redirect to `/auth/login`
- ✅ Cannot access without authentication

### 4.2 Test Protected Routes (Logged In)

**Login again:**
1. Email: `owner@demolishing.com`
2. Password: `password123`

**Access protected routes:**
```
http://localhost:3000/dashboard
http://localhost:3000/dashboard/leads
http://localhost:3000/dashboard/calendar
http://localhost:3000/dashboard/settings
```

**Expected for ALL:**
- ✅ Page loads successfully
- ✅ Content displays
- ✅ No redirect

---

## Test 5: Dashboard UI Updates

### 5.1 Verify Business Name in Sidebar

**While logged in:**
1. Navigate to `/dashboard`
2. Check sidebar (desktop) or open mobile menu

**Expected:**
- ✅ Sidebar header shows "Desk.ai"
- ✅ Second line shows business name: "Houston Demo Plumbing"
- ✅ Business name is dynamic (from currentBusiness state)

### 5.2 Verify Logout Button

**Desktop:**
- ✅ Logout button visible at bottom of sidebar
- ✅ Shows logout icon + "Log Out" text
- ✅ Hover state changes color

**Mobile:**
- ✅ Logout button visible at bottom of mobile sidebar
- ✅ Same styling as desktop

**Test logout:**
1. Click "Log Out"

**Expected:**
- ✅ Session cleared
- ✅ Redirect to `/auth/login`
- ✅ Console log: "Logging out..."
- ✅ Cannot access dashboard without logging in again

---

## Test 6: Multi-Business Support

### 6.1 Create Second Business for Same User

**In Supabase SQL Editor:**
```sql
-- Get the user ID
SELECT id FROM auth.users WHERE email = 'owner@demolishing.com';

-- Create second business
INSERT INTO businesses (slug, name, phone, industry, service_zip_codes, is_active)
VALUES (
  'houston-hvac-pros',
  'Houston HVAC Pros',
  '+1-713-555-0200',
  'hvac',
  ARRAY['77005', '77030'],
  true
)
RETURNING id;

-- Link user to second business (use user_id and business_id from above)
INSERT INTO business_users (user_id, business_id, role, is_default)
VALUES (
  '<user_id>',  -- Replace with actual user ID
  '<business_id>',  -- Replace with new business ID
  'owner',
  false
);
```

### 6.2 Test Business Selector

**After creating second business:**
1. Refresh dashboard page
2. Check sidebar

**Expected:**
- ✅ Business selector dropdown appears (above "Demo Chat" button)
- ✅ Label: "Switch Business"
- ✅ Dropdown shows both businesses:
  - Houston Demo Plumbing
  - Houston HVAC Pros
- ✅ Default business is selected (Houston Demo Plumbing)

### 6.3 Test Switching Businesses

1. Click business selector dropdown
2. Select "Houston HVAC Pros"

**Expected:**
- ✅ Sidebar updates: "Houston HVAC Pros" shown
- ✅ Console log: "Switching to business: Houston HVAC Pros"
- ✅ currentBusiness state updates
- ✅ Database updates is_default flag:
  ```sql
  -- Verify with:
  SELECT bu.is_default, b.name
  FROM business_users bu
  JOIN businesses b ON b.id = bu.business_id
  WHERE bu.user_id = '<user_id>';
  
  -- Expected: Houston HVAC Pros has is_default = true
  ```

---

## Test 7: AuthContext Functionality

### 7.1 Test useAuth Hook

**Create test component** (frontend/pages/auth-test.js):
```jsx
import { useAuth } from '../contexts/AuthContext';

export default function AuthTest() {
  const { user, currentBusiness, businesses, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth State Test</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify({ user, currentBusiness, businesses }, null, 2)}
      </pre>
    </div>
  );
}
```

**Navigate to:** `http://localhost:3000/auth-test`

**Expected (logged in):**
```json
{
  "user": {
    "id": "<uuid>",
    "email": "owner@demolishing.com",
    ...
  },
  "currentBusiness": {
    "id": "<uuid>",
    "name": "Houston Demo Plumbing",
    "slug": "houston-demo-plumbing",
    "role": "owner",
    ...
  },
  "businesses": [
    { "id": "<uuid>", "name": "Houston Demo Plumbing", ... },
    { "id": "<uuid>", "name": "Houston HVAC Pros", ... }
  ]
}
```

**Expected (logged out):**
```json
{
  "user": null,
  "currentBusiness": null,
  "businesses": []
}
```

---

## Test 8: Error Handling

### 8.1 Test Duplicate Email Signup

1. Go to `/auth/signup`
2. Try to signup with existing email: `owner@demolishing.com`
3. Complete all fields
4. Click "Create Account"

**Expected:**
- ✅ Error message shown
- ✅ Error mentions duplicate email or user already exists
- ✅ Button returns to enabled state

### 8.2 Test Network Failure

**Simulate offline:**
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try to login

**Expected:**
- ✅ Error message shown
- ✅ Graceful error handling (not a crash)
- ✅ Error mentions network or connection issue

---

## Test 9: Edge Cases

### 9.1 Test Special Characters in Business Name

**Create business with special characters:**
```
Business name: "Joe's HVAC & Plumbing, Inc."
```

**Expected:**
- ✅ Signup succeeds
- ✅ Slug generated: `joes-hvac-plumbing-inc`
- ✅ Name stored with special characters intact
- ✅ Business name displays correctly in sidebar

### 9.2 Test Long Business Name

**Create business with long name:**
```
Business name: "The Very Long Business Name That Goes On And On Plumbing Services Incorporated"
```

**Expected:**
- ✅ Signup succeeds
- ✅ Full name stored in database
- ✅ Sidebar truncates or wraps name gracefully
- ✅ No UI breaking

### 9.3 Test Multiple ZIP Codes

**Create business with many ZIP codes:**
```
ZIP codes: 77005, 77030, 77098, 77002, 77004, 77006, 77019, 77025, 77027
```

**Expected:**
- ✅ All ZIP codes stored in database as array
- ✅ Trimmed and parsed correctly

---

## Test 10: Console Logs Verification

### 10.1 Signup Console Logs

**Expected sequence:**
```
Creating auth user...
Auth user created: <user_id>
Creating business...
Business created: <business_id>
Creating business-user mapping...
Business-user mapping created
✅ Signup complete
```

### 10.2 Login Console Logs

**Expected sequence:**
```
Signing in... owner@demolishing.com
Auth state changed: SIGNED_IN
Loading businesses for user: <user_id>
Loaded businesses: [{ name: "Houston Demo Plumbing", ... }]
✅ Login successful
```

### 10.3 Logout Console Logs

**Expected sequence:**
```
Logging out...
Auth state changed: SIGNED_OUT
```

### 10.4 Business Switch Logs

**Expected:**
```
Switching to business: Houston HVAC Pros
```

---

## Troubleshooting

### Issue: Redirect loop after login

**Symptoms:**
- Page keeps redirecting between `/dashboard` and `/auth/login`

**Solutions:**
1. Check AuthContext is wrapped around _app.js
2. Check withAuth HOC is applied to dashboard pages
3. Clear browser cookies/localStorage
4. Check Supabase session is being stored

### Issue: "No businesses found for user"

**Symptoms:**
- User logs in but sidebar shows "Loading..."
- Console warning: "No businesses found for user"

**Solutions:**
1. Verify business_users mapping exists:
   ```sql
   SELECT * FROM business_users WHERE user_id = '<user_id>';
   ```
2. Check business was created during signup
3. Re-create mapping manually if needed

### Issue: Session not persisting

**Symptoms:**
- User must login again after page refresh

**Solutions:**
1. Check `persistSession: true` in supabase.js config
2. Check browser allows localStorage/cookies
3. Check Supabase URL/key are correct
4. Try different browser

### Issue: Business name not showing

**Symptoms:**
- Sidebar shows "Loading..." instead of business name

**Solutions:**
1. Check `currentBusiness` in AuthContext state
2. Verify `loadUserBusinesses()` is being called
3. Check Supabase query permissions (RLS policies)
4. Check browser console for errors

---

## Success Criteria Checklist

✅ **Signup**
- [ ] User can create account with email/password
- [ ] Business is created automatically
- [ ] User is linked to business via business_users
- [ ] Profile is created
- [ ] Redirect to dashboard after signup

✅ **Login**
- [ ] User can login with correct credentials
- [ ] Invalid credentials show error
- [ ] Redirect to dashboard after login

✅ **Session**
- [ ] Session persists across page refreshes
- [ ] Session persists in new tabs
- [ ] Session persists after browser restart

✅ **Route Protection**
- [ ] Dashboard routes redirect to login when logged out
- [ ] Dashboard routes accessible when logged in

✅ **UI Updates**
- [ ] Business name shown in sidebar
- [ ] Logout button visible and functional
- [ ] Business selector shown for multi-business users
- [ ] Switching businesses updates UI

✅ **Database**
- [ ] All tables (businesses, profiles, business_users) populated correctly
- [ ] Foreign keys intact
- [ ] No orphaned records

✅ **Error Handling**
- [ ] Duplicate email handled gracefully
- [ ] Invalid credentials show friendly errors
- [ ] Network failures don't crash app
- [ ] Validation errors are clear

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
4. ✅ Mark Step 5 (Owner Authentication) as complete
5. ✅ Proceed to Step 6 (if applicable)
