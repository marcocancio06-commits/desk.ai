# Owner Onboarding Testing Checklist

## Pre-Testing Setup

### Backend Status
- [x] Backend server restarted with new changes
- [x] Running on port 3001
- [x] `/api/business/create` endpoint verified

### Frontend Status
- [x] Frontend server running on port 3000
- [ ] Browser cache cleared
- [ ] Incognito/private window recommended

---

## Test 1: Complete Owner Signup Flow ✅ PRIORITY

### Step-by-Step Instructions

1. **Navigate to Get Started**
   - URL: http://localhost:3000/get-started
   - [ ] Page loads successfully
   - [ ] See two cards: "Create business account" and "Find services"

2. **Choose Owner Flow**
   - [ ] Click "Create business account" (blue card)
   - [ ] Redirect to `/auth/signup?role=owner`

3. **Sign Up**
   - Email: `testowner@example.com`
   - Password: `test123456`
   - Confirm: `test123456`
   - [ ] Click "Create Account & Continue"
   - [ ] See loading state
   - [ ] **EXPECTED:** Redirect to `/onboarding` (not `/dashboard`)

4. **Onboarding Step 1: Business Details**
   - Business Name: `Test Plumbing Co`
   - Industry: Select `Plumbing`
   - Phone: `555-123-4567`
   - Email: `contact@testplumbing.com`
   - [ ] See slug preview: `desk.ai/b/test-plumbing-co`
   - [ ] Click "Continue"

5. **Onboarding Step 2: Service Area**
   - [ ] Add ZIP code: `90210` → Click "Add"
   - [ ] Add ZIP code: `90211` → Click "Add"
   - [ ] See 2 ZIP chips displayed
   - [ ] Click "Continue"

6. **Onboarding Step 3: Branding (Optional)**
   - [ ] Skip logo upload
   - [ ] Keep default color scheme
   - [ ] Click "Continue"

7. **Onboarding Step 4: Review**
   - [ ] See summary of all entered information
   - [ ] See business name: "Test Plumbing Co"
   - [ ] See industry: "Plumbing"
   - [ ] See ZIP codes: 90210, 90211
   - [ ] See URL preview: `desk.ai/b/test-plumbing-co`
   - [ ] Click "Finish Setup"
   - [ ] See loading spinner

8. **Expected Result:**
   - [ ] **SUCCESS:** Redirect to `/dashboard`
   - [ ] No error messages
   - [ ] Business name appears in dashboard

**If Error Occurs:**
```
Error message: ___________________________________
Console errors: ___________________________________
Network tab (Response): ___________________________
```

---

## Test 2: Verify Backend Logging

### Check Logs
```bash
tail -f /tmp/backend.log | grep Onboarding
```

### Expected Log Messages:
- [ ] `[Onboarding] User {userId} existing businesses: 0`
- [ ] `[Onboarding] Generating slug: "Test Plumbing Co" → "test-plumbing-co"`
- [ ] `[Onboarding] Slug "test-plumbing-co" is unique`
- [ ] `[Onboarding] Business created successfully: {businessId}`
- [ ] `[Onboarding] Linking user {userId} to business {businessId}`
- [ ] `[Onboarding] User linked successfully as owner`

---

## Test 3: Database Verification

### Check Business Record
```sql
-- Copy this into Supabase SQL Editor
SELECT 
  id,
  name,
  slug,
  industry,
  phone,
  email,
  service_zip_codes,
  is_active,
  onboarding_completed,
  created_at
FROM businesses
WHERE slug = 'test-plumbing-co';
```

**Expected Result:**
- [ ] 1 row returned
- [ ] `name = "Test Plumbing Co"`
- [ ] `slug = "test-plumbing-co"`
- [ ] `industry = "plumbing"`
- [ ] `phone = "555-123-4567"`
- [ ] `email = "contact@testplumbing.com"`
- [ ] `service_zip_codes = ["90210", "90211"]`
- [ ] `is_active = true`
- [ ] `onboarding_completed = true`

### Check User Linkage
```sql
SELECT 
  bu.id,
  bu.role,
  bu.is_default,
  b.name AS business_name,
  p.email AS user_email
FROM business_users bu
JOIN businesses b ON b.id = bu.business_id
JOIN profiles p ON p.id = bu.user_id
WHERE p.email = 'testowner@example.com';
```

**Expected Result:**
- [ ] 1 row returned
- [ ] `role = "owner"`
- [ ] `is_default = true`
- [ ] `business_name = "Test Plumbing Co"`
- [ ] `user_email = "testowner@example.com"`

### Check Profile Role
```sql
SELECT id, email, role, full_name
FROM profiles
WHERE email = 'testowner@example.com';
```

**Expected Result:**
- [ ] `role = "owner"` (NOT "client")

---

## Test 4: Marketplace Directory

### Navigate to Directory
- URL: http://localhost:3000/directory
- [ ] Page loads successfully
- [ ] See "Test Plumbing Co" in business listings
- [ ] See industry badge: "Plumbing"
- [ ] See service area: "90210, 90211"

### Click Business Card
- [ ] Click on "Test Plumbing Co" card
- [ ] **EXPECTED:** Redirect to `/b/test-plumbing-co`

---

## Test 5: Business Chat Page

### Navigate Directly
- URL: http://localhost:3000/b/test-plumbing-co
- [ ] Page loads successfully
- [ ] See business name in header: "Test Plumbing Co"
- [ ] See chat interface
- [ ] See input field at bottom

### Send Test Message
- Message: `Hello, what services do you offer?`
- [ ] Click send or press Enter
- [ ] Message appears in chat
- [ ] AI responds with context about plumbing services
- [ ] Response mentions business name or industry

---

## Test 6: Duplicate Slug Handling

### Create Second Business with Same Name

1. **Sign Out**
   - [ ] Click profile/logout
   - [ ] Redirected to home page

2. **Sign Up with New Account**
   - Email: `testowner2@example.com`
   - Password: `test123456`
   - [ ] Complete signup
   - [ ] Redirect to `/onboarding`

3. **Enter Same Business Name**
   - Business Name: `Test Plumbing Co` (exact same)
   - Industry: `HVAC` (different)
   - Phone: `555-999-8888`
   - Email: `contact2@test.com`
   - [ ] Complete all steps

4. **Expected Result:**
   - [ ] Business created successfully
   - [ ] Slug auto-incremented: `test-plumbing-co-2`
   - [ ] No error about duplicate slug

### Verify in Database
```sql
SELECT slug, name FROM businesses
WHERE name LIKE 'Test Plumbing Co%'
ORDER BY created_at;
```

**Expected:**
- [ ] Row 1: `test-plumbing-co` | `Test Plumbing Co`
- [ ] Row 2: `test-plumbing-co-2` | `Test Plumbing Co`

---

## Test 7: Error Handling

### Test Business Limit
1. **Log in as** `testowner@example.com`
2. **Try to access** `/onboarding` manually
3. **Expected:**
   - [ ] See error: "You already have a business setup. Redirecting to dashboard..."
   - [ ] Auto-redirect after 2 seconds
   - [ ] Lands on `/dashboard`

### Test Validation Errors

#### Missing Business Name
1. Sign up new owner
2. On Step 1, leave business name empty
3. Click "Continue"
4. **Expected:**
   - [ ] Cannot proceed (button disabled or validation error)

#### Missing ZIP Codes
1. Sign up new owner
2. Complete Step 1
3. On Step 2, don't add any ZIP codes
4. Click "Continue"
5. **Expected:**
   - [ ] Cannot proceed (button disabled or shows error)

---

## Test 8: Client Flow (Verify No Breaking Changes)

### Sign Up as Client
1. Navigate to http://localhost:3000/get-started
2. Click "Find services" (green card)
3. Sign up:
   - Email: `testclient@example.com`
   - Password: `test123456`
4. **Expected:**
   - [ ] Redirect to `/client` (NOT `/onboarding`)
   - [ ] Auto-assigned to demo business
   - [ ] Can start chat immediately

---

## Test 9: Dashboard Functionality

### After Onboarding Completes
- [ ] Dashboard shows business name
- [ ] Can access business settings
- [ ] Can view leads (if any)
- [ ] Navigation works correctly

---

## Test 10: Branding Consistency

### Check for "Frontdesk AI" vs "Desk.ai"
- [ ] Onboarding steps use "Desk.ai"
- [ ] Business URL preview shows `desk.ai/b/...`
- [ ] No references to "Frontdesk AI" found

---

## Cleanup After Testing

### Delete Test Data (Optional)
```sql
-- Delete test businesses
DELETE FROM businesses WHERE slug LIKE 'test-plumbing-co%';

-- Delete test profiles
DELETE FROM profiles WHERE email LIKE 'testowner%@example.com';
DELETE FROM profiles WHERE email = 'testclient@example.com';
```

---

## Final Checklist

- [ ] All tests passed
- [ ] No console errors
- [ ] Backend logs show successful operations
- [ ] Database contains correct records
- [ ] Marketplace directory works
- [ ] Business chat pages load
- [ ] Slug uniqueness working
- [ ] Error handling appropriate

---

## Known Issues / Notes

**Issue 1:**
- Description: _______________________________________
- Severity: (Low / Medium / High / Critical)
- Workaround: _______________________________________

**Issue 2:**
- Description: _______________________________________
- Severity: (Low / Medium / High / Critical)
- Workaround: _______________________________________

---

## Summary

**Test Date:** _______________
**Tested By:** _______________
**Overall Result:** ⬜ PASS / ⬜ FAIL
**Notes:** 
___________________________________________________
___________________________________________________
___________________________________________________
