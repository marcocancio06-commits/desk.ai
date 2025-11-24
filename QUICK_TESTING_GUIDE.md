# Quick Testing Guide - Onboarding Wizard

## Pre-requisites
- Backend running on http://localhost:3001
- Frontend running on http://localhost:3000
- Supabase configured with migration 007 applied

---

## Test Case 1: New User Complete Onboarding

### 1. Create Account
```
URL: http://localhost:3000/auth/signup
Email: test-owner-1@example.com
Password: password123
```

**Expected:** Redirect to `/onboarding`

### 2. Step 1 - Business Details
```
Business Name: Houston HVAC Pro
Industry: HVAC
Phone: +1-713-555-0100
Email: contact@houstonhvac.com
```

**Expected:** 
- Slug preview shows: `desk.ai/b/houston-hvac-pro`
- Continue button enabled

### 3. Step 2 - Service Area
```
Add ZIP codes: 77005, 77030, 77098
```

**Expected:**
- Each ZIP shows as blue tag
- Can remove tags by clicking X
- Continue button enabled

### 4. Step 3 - Branding
```
Color Scheme: Blue (or Default)
Logo: Skip for now
```

**Expected:** Can continue without logo

### 5. Step 4 - Confirm
```
Review all details
Check slug shows: desk.ai/b/houston-hvac-pro
```

**Expected:**
- All details displayed correctly
- "Finish Setup" button visible

### 6. Create Business
```
Click "Finish Setup"
```

**Expected:**
- Loading spinner appears
- Redirect to `/dashboard`
- Dashboard shows:
  - Business name in header
  - Stats cards (may be zero)
  - NO "Welcome to Desk.ai" empty state

---

## Test Case 2: Existing User Without Business

### 1. Create Account (Don't Complete Onboarding)
```
1. Signup as test-owner-2@example.com
2. When redirected to /onboarding, close browser tab
3. Later, login via /auth/login
```

### 2. See Empty State
```
URL: http://localhost:3000/dashboard
```

**Expected:**
- Header: "Welcome to Desk.ai"
- Message: "No business connected"
- Blue "Get Started" button visible

### 3. Click Get Started
```
Click the "Get Started" button
```

**Expected:**
- Redirect to `/onboarding`
- Can complete wizard
- After completion, dashboard shows business data

---

## Test Case 3: Verify Slug Uniqueness

### Test Multiple Businesses with Same Name
```
Business 1: "Best Plumbing" → slug: best-plumbing
Business 2: "Best Plumbing" → slug: best-plumbing-1
Business 3: "Best Plumbing" → slug: best-plumbing-2
```

**Verify in Database:**
```sql
SELECT slug, name FROM businesses 
WHERE name = 'Best Plumbing'
ORDER BY created_at;
```

---

## Test Case 4: Public Business Page

### 1. Create Business
```
Complete onboarding with:
Business Name: Test Plumbing Co
(Creates slug: test-plumbing-co)
```

### 2. Visit Public Page
```
URL: http://localhost:3000/b/test-plumbing-co
```

**Expected:**
- Business page loads
- Chat widget appears
- Can send messages
- Messages create leads in dashboard

---

## Quick Verification Checklist

### ✅ Branding
- [ ] Dashboard empty state says "Welcome to Desk.ai" (NOT "Frontdesk AI")

### ✅ Onboarding Flow
- [ ] Signup redirects to /onboarding
- [ ] Step 1 shows slug preview in real-time
- [ ] Step 4 shows final slug before creation
- [ ] Finish Setup creates business and redirects to dashboard

### ✅ Dashboard
- [ ] Shows empty state if no business
- [ ] "Get Started" button goes to /onboarding
- [ ] Shows business data if business exists
- [ ] No infinite spinner bug

### ✅ Database
- [ ] New row in `businesses` table
- [ ] New row in `business_users` table
- [ ] `business_users.role = 'owner'`
- [ ] `business_users.is_default = true`

### ✅ Public Pages
- [ ] /b/[slug] works for new businesses
- [ ] Chat creates leads linked to correct business
- [ ] Leads appear in owner dashboard

---

## Database Verification Queries

### Check User's Business
```sql
SELECT 
  p.id as user_id,
  p.full_name,
  b.slug,
  b.name as business_name,
  bu.role,
  bu.is_default
FROM profiles p
LEFT JOIN business_users bu ON bu.user_id = p.id
LEFT JOIN businesses b ON b.id = bu.business_id
WHERE p.id = 'your-user-id-here';
```

### Check All Businesses
```sql
SELECT 
  id,
  slug,
  name,
  industry,
  service_zip_codes,
  onboarding_completed,
  created_at
FROM businesses
ORDER BY created_at DESC
LIMIT 10;
```

### Check Slug Uniqueness
```sql
SELECT slug, COUNT(*) as count
FROM businesses
GROUP BY slug
HAVING COUNT(*) > 1;
```

**Expected:** Zero rows (all slugs unique)

---

## Troubleshooting

### Issue: "Failed to create business"
**Check:**
1. Backend server running? `curl http://localhost:3001/health`
2. Supabase credentials correct? Check `.env`
3. Migration 007 applied? Check Supabase dashboard

### Issue: Dashboard still shows "No business"
**Fix:**
1. Clear localStorage: `localStorage.clear()` in browser console
2. Reload page: `window.location.reload()`
3. Check database: Does `business_users` link exist?

### Issue: Slug preview not updating
**Check:**
1. Business name field has value
2. Step1BusinessDetails.js slug generation logic
3. Browser console for errors

---

## Success Criteria

### ✅ Complete Success:
1. New user can signup → onboarding → dashboard
2. Existing user can complete onboarding from dashboard
3. Slug generation works and is unique
4. Business created in database with correct columns
5. Dashboard shows business data (not empty state)
6. Public /b/[slug] page works
7. All branding says "Desk.ai" (not "Frontdesk AI")

---

## Next Steps After Testing

1. **If tests pass:**
   - Commit changes (see commit messages in main doc)
   - Deploy to staging
   - Test with real users

2. **If tests fail:**
   - Check error logs in browser console
   - Check backend logs: `tail -f frontdesk-backend/logs/*.log`
   - Verify database schema matches migration 007
   - See troubleshooting section above

---

**Ready to test?** Start with Test Case 1 above! 🚀
