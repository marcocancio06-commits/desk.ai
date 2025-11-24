# 🧪 Supabase Testing Checklist

## Before You Start

### ✅ Verify Servers Are Running
```bash
# Backend (should return: {"status":"ok","database":"connected"})
curl http://localhost:3001/health

# Frontend (should return: HTTP/1.1 200 OK)
curl -I http://localhost:3000/
```

**Expected Console Output:**

Backend:
```
📊 Database: ✅ Connected
🔐 Supabase Auth: ✅ Configured
```

Frontend:
```
- Environments: .env.local
✓ Ready in 836ms
```

---

## Test 1: Signup ✅

### Steps
1. Open http://localhost:3000/auth/signup
2. Enter:
   - Email: `test@deskai.com`
   - Password: `TestPassword123!`
3. Click "Sign Up"

### Expected Results
- ✅ No console errors
- ✅ No "Supabase not configured" warning
- ✅ Redirected to `/onboarding` (or `/dashboard` if onboarding is skipped)
- ✅ LocalStorage contains `deskai-auth-token`

### How to Verify
**In Browser DevTools:**
1. Open Console → Should be clean (no errors)
2. Application → Local Storage → `http://localhost:3000`
3. Look for key: `deskai-auth-token`
4. Value should be a JSON object with session data

**In Supabase Dashboard:**
1. Go to: https://gvjowuscugbgvnemrlmi.supabase.co/project/gvjowuscugbgvnemrlmi/auth/users
2. Should see new user with email `test@deskai.com`

---

## Test 2: Login ✅

### Steps
1. Open http://localhost:3000/auth/login
2. Enter same credentials:
   - Email: `test@deskai.com`
   - Password: `TestPassword123!`
3. Click "Login"

### Expected Results
- ✅ Login succeeds
- ✅ Redirected to `/dashboard`
- ✅ User data loaded in dashboard

### How to Verify
**In Network Tab:**
1. DevTools → Network → Filter by "Fetch/XHR"
2. Look for requests to Supabase API
3. Check headers include: `Authorization: Bearer eyJ...`

---

## Test 3: Session Persistence ✅

### Steps
1. Login successfully
2. Press `Cmd+R` (or F5) to refresh page
3. Wait for page to reload

### Expected Results
- ✅ Still logged in (no redirect to login)
- ✅ Dashboard loads with user data
- ✅ No authentication popup/challenge

### How to Verify
```javascript
// In browser console:
localStorage.getItem('deskai-auth-token')
// Should return session JSON (not null)
```

---

## Test 4: Business Onboarding ✅

### Steps
1. Complete signup (if not already done)
2. Complete onboarding wizard:

   **Step 1: Business Type**
   - Select: "Plumbing"
   - Click "Next"

   **Step 2: Business Details**
   - Business Name: "Test Plumbing Co"
   - Phone: "555-123-4567"
   - Website: "testplumbing.com"
   - Click "Next"

   **Step 3: Service Areas**
   - Enter ZIP: "90210"
   - Click "Add ZIP Code"
   - Click "Next"

   **Step 4: AI Personality**
   - Select: "Professional & Friendly"
   - Click "Complete Setup"

### Expected Results
- ✅ All 4 steps complete without errors
- ✅ Redirected to `/dashboard` after final step
- ✅ Business appears in dashboard

### How to Verify in Supabase
Run in SQL Editor:
```sql
SELECT 
  b.id,
  b.name,
  b.slug,
  b.industry,
  b.phone,
  b.owner_user_id,
  u.email
FROM businesses b
JOIN auth.users u ON b.owner_user_id = u.id
WHERE b.name = 'Test Plumbing Co';
```

Expected result:
```
name: "Test Plumbing Co"
slug: "test-plumbing-co"
industry: "plumbing"
phone: "555-123-4567"
email: "test@deskai.com"
```

---

## Test 5: getSession() Works ✅

### Steps
1. While logged in, open browser console
2. Run:
```javascript
import { getSession } from '/lib/supabase.js';
const session = await getSession();
console.log(session);
```

### Expected Results
- ✅ Returns session object
- ✅ Has `access_token` field
- ✅ Has `user` object with email

**Sample Output:**
```javascript
{
  access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  refresh_token: "...",
  expires_at: 1234567890,
  user: {
    id: "uuid",
    email: "test@deskai.com",
    ...
  }
}
```

---

## Test 6: auth.signUp() Works ✅

### Steps (Alternative Signup Method)
1. Open browser console on http://localhost:3000
2. Run:
```javascript
import { signUp } from '/lib/supabase.js';
const result = await signUp('another@test.com', 'Password123!');
console.log(result);
```

### Expected Results
- ✅ Returns `{ user, session }` object
- ✅ User created in Supabase
- ✅ No errors thrown

---

## Test 7: Logout ✅

### Steps
1. While logged in, click "Logout" button
2. Observe behavior

### Expected Results
- ✅ Redirected to `/auth/login`
- ✅ LocalStorage cleared (`deskai-auth-token` removed)
- ✅ Cannot access `/dashboard` without logging in again

### How to Verify
```javascript
// In browser console after logout:
localStorage.getItem('deskai-auth-token')
// Should return: null
```

---

## Test 8: Protected Routes ✅

### Steps
1. Logout (if logged in)
2. Try to access: http://localhost:3000/dashboard
3. Observe behavior

### Expected Results
- ✅ Redirected to `/auth/login`
- ✅ After login, redirected back to `/dashboard`

---

## Test 9: API Authentication ✅

### Steps
1. Login to get session
2. In browser console, run:
```javascript
// Get session token
import { getSession } from '/lib/supabase.js';
const session = await getSession();

// Make authenticated API call
const response = await fetch('http://localhost:3001/api/businesses', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
});

const data = await response.json();
console.log(data);
```

### Expected Results
- ✅ Request succeeds (200 OK)
- ✅ Returns list of businesses
- ✅ Backend validates token successfully

---

## Test 10: No Console Warnings ✅

### Steps
1. Open http://localhost:3000/auth/signup
2. Open browser console (Cmd+Option+J)
3. Check for warnings

### Expected Results
- ✅ NO "Supabase not configured" warning
- ✅ NO environment variable warnings
- ✅ Clean console (only Next.js dev messages)

**Before Fix:**
```
⚠️ Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**After Fix:**
```
(Clean console, no warnings)
```

---

## 🐛 Common Issues & Solutions

### Issue: "Missing Supabase configuration" in console

**Cause:** `.env.local` not created or not loaded

**Solution:**
```bash
# 1. Verify file exists
ls -la /Users/marco/Desktop/agency-mvp/frontend/.env.local

# 2. Verify contents
cat /Users/marco/Desktop/agency-mvp/frontend/.env.local

# 3. Restart Next.js
cd /Users/marco/Desktop/agency-mvp/frontend
npm run dev
```

---

### Issue: Signup returns "Invalid API key"

**Cause:** Wrong credentials in `.env.local`

**Solution:**
```bash
# Verify credentials match Supabase dashboard:
# URL: https://gvjowuscugbgvnemrlmi.supabase.co
# Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Edit .env.local if needed
code /Users/marco/Desktop/agency-mvp/frontend/.env.local
```

---

### Issue: Session doesn't persist after refresh

**Cause:** localStorage disabled (incognito mode) or wrong storage key

**Solution:**
1. Exit incognito mode
2. Clear localStorage:
```javascript
localStorage.clear();
```
3. Login again

---

### Issue: Business onboarding fails

**Cause:** Backend missing `SUPABASE_SERVICE_ROLE_KEY`

**Solution:**
```bash
# Verify backend .env
cat /Users/marco/Desktop/agency-mvp/frontdesk-backend/.env

# Should contain:
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Restart backend
cd /Users/marco/Desktop/agency-mvp/frontdesk-backend
npm run dev
```

---

## ✅ Success Checklist

Mark each when tested:

- [ ] Signup creates user in Supabase
- [ ] Login works and redirects to dashboard
- [ ] Session persists across page refresh
- [ ] Business onboarding completes all 4 steps
- [ ] Logout clears session and redirects
- [ ] Protected routes require authentication
- [ ] API calls include auth headers
- [ ] No "Supabase not configured" warnings
- [ ] `getSession()` returns session object
- [ ] `signUp()` creates new users

---

## 🎯 Final Verification

Run this complete test flow:

1. **Signup** → Should work ✅
2. **Complete onboarding** → Business created ✅
3. **Refresh page** → Still logged in ✅
4. **Logout** → Session cleared ✅
5. **Login again** → Works ✅
6. **Access dashboard** → Loads with data ✅

**If all 6 steps pass, your Supabase integration is working correctly!** 🎉

---

## 📊 Expected Server Logs

### Backend Console
```
📊 Database: ✅ Connected
🔐 Supabase Auth: ✅ Configured
🚀 Server running on port 3001
```

### Frontend Console
```
▲ Next.js 14.2.33
- Local:        http://localhost:3000
- Environments: .env.local
✓ Ready in 836ms
```

### Browser Console (After Login)
```
(No errors or warnings - clean console)
```

---

## 🔗 Quick Links

- **Signup Page:** http://localhost:3000/auth/signup
- **Login Page:** http://localhost:3000/auth/login
- **Dashboard:** http://localhost:3000/dashboard
- **Supabase Auth Users:** https://gvjowuscugbgvnemrlmi.supabase.co/project/gvjowuscugbgvnemrlmi/auth/users
- **Backend Health:** http://localhost:3001/health

---

**Ready to test!** Start with Test 1 (Signup) and work through the checklist. 🚀
