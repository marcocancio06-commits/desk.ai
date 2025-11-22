# Authentication Setup Guide

This guide covers Step 2 of the multi-tenancy implementation: Authentication and Business Context.

## Overview

Desk.ai now uses **Supabase Auth** for user authentication and session management. All dashboard routes are protected and require authentication. Users are automatically assigned to the demo business upon signup.

## What Was Implemented

### Backend (`frontdesk-backend/`)

1. **`authHelper.js`** - New authentication helper module
   - `verifyAccessToken()` - Validates Supabase JWT tokens
   - `getOrCreateProfile()` - Auto-creates user profiles
   - `assignUserToDemoBusiness()` - Auto-assigns new users to demo business
   - `getUserDefaultBusiness()` - Gets user's default or first business
   - `getContextFromRequest()` - Extracts auth context from requests
   - `requireAuth` - Middleware to protect routes (requires user)
   - `requireBusiness` - Middleware to protect routes (requires user + business)
   - `getUserBusinesses()` - Gets all businesses a user can access

2. **Updated `index.js`** - Protected API endpoints
   - `/api/leads` - Now requires auth
   - `/api/summary` - Now requires auth
   - `/api/appointments` - Now requires auth (GET and POST)
   - New `/api/auth/me` - Get current user and business info
   - New `/api/auth/businesses` - Get all user's businesses
   - Demo mode still supported: `?businessId=demo-plumbing` bypasses auth

### Frontend (`frontend/`)

1. **`lib/supabase.js`** - Supabase client configuration
   - Browser-based Supabase client
   - Auth helper functions (signIn, signUp, signOut)
   - `getAuthHeader()` - Returns Authorization header for API calls
   - `onAuthStateChange()` - Subscribe to auth events

2. **`contexts/AuthContext.js`** - React auth context
   - `AuthProvider` - Wraps app with auth state
   - `useAuth()` - Hook to access auth state
   - `withAuth()` - HOC to protect routes

3. **`pages/login.js`** - Login/Signup page
   - Toggle between sign in and sign up
   - Email + password authentication
   - Auto-redirects to `/dashboard` on success
   - Link back to marketing site

4. **`pages/logout.js`** - Logout page
   - Clears session and redirects to home

5. **Updated Dashboard Pages** - All protected with `withAuth()`
   - `/dashboard/index.js`
   - `/dashboard/leads.js`
   - `/dashboard/calendar.js`
   - `/dashboard/settings.js`

6. **Updated API Calls** - All use auth headers
   - Dashboard pages now include `Authorization: Bearer <token>`
   - No more hard-coded `businessId` query params

7. **Updated `components/TopBar.js`** - User menu
   - Shows user avatar (email initial)
   - Dropdown menu with Settings and Sign Out
   - Click outside to close

8. **Updated `_app.js`** - Wrapped with AuthProvider
   - All pages have access to auth context

## Environment Variables Needed

### Backend `.env`
Already configured (uses same Supabase connection as database):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Frontend `.env.local`
**NEW - You must add these:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

**Where to find these:**
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
2. Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

⚠️ **Important:** Use the `anon` key for the frontend, NOT the `service_role` key!

## Database Migration Required

Before auth will work, you must run the multi-tenancy migration:

```sql
-- Run this in Supabase SQL Editor
-- File: frontdesk-backend/migrations/007_add_multi_tenancy.sql
```

This creates:
- `profiles` table (linked to `auth.users`)
- `businesses` table
- `business_users` junction table
- Demo business with ID `00000000-0000-0000-0000-000000000001`

See `MULTI_TENANCY_MIGRATION.md` for full migration instructions.

## How It Works

### User Flow

1. **New User Signs Up**
   ```
   User → /login → Enter email/password → Sign Up
   → Supabase creates auth.users record
   → Backend auto-creates profile in profiles table
   → Backend auto-assigns to demo business (business_users table)
   → Redirect to /dashboard
   ```

2. **Returning User Logs In**
   ```
   User → /login → Enter email/password → Sign In
   → Supabase validates credentials
   → Frontend stores session (localStorage)
   → Redirect to /dashboard
   ```

3. **Protected Page Access**
   ```
   User visits /dashboard
   → withAuth() HOC checks session
   → If no session → redirect to /login
   → If session valid → render page
   → Page makes API call with Authorization header
   → Backend validates token
   → Backend loads user's default business
   → Returns data filtered by business
   ```

4. **API Request Flow**
   ```
   Frontend: fetch('/api/leads', { headers: { Authorization: 'Bearer <token>' } })
   → Backend: requireBusiness middleware
   → Verify token with Supabase
   → Load user profile
   → Get user's default business
   → Attach to req.authContext
   → Route handler uses authContext.businessId
   → Query database filtered by business
   → Return data
   ```

### Demo Mode

The public demo chat still works without auth:
```javascript
// Demo chat sends:
POST /api/message?businessId=demo-plumbing

// authHelper detects demo mode:
if (businessId === 'demo-plumbing') {
  context.isDemo = true;
  context.businessId = '00000000-0000-0000-0000-000000000001';
  // Skip auth validation
}
```

## Testing

### 1. Start Both Servers

```bash
# Terminal 1 - Backend
cd frontdesk-backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Test Public Routes (No Auth Required)

- ✅ `http://localhost:3000/` - Marketing home
- ✅ `http://localhost:3000/pricing` - Pricing page
- ✅ `http://localhost:3000/demo-chat` - Demo chat (uses demo business)

### 3. Test Protected Routes (Requires Auth)

Visit `http://localhost:3000/dashboard`
- Should redirect to `/login` if not logged in

### 4. Create Test Account

1. Go to `http://localhost:3000/login`
2. Toggle to "Sign Up"
3. Enter:
   - Email: `test@example.com`
   - Password: `test123` (min 6 chars)
   - Full Name: `Test User`
4. Click "Create Account"
5. Should redirect to `/dashboard`
6. You should see leads data (demo business data)

### 5. Verify User Menu

1. Top right of dashboard shows avatar with your email initial
2. Click avatar → dropdown menu
3. Options: Settings, Sign Out
4. Click "Sign Out" → redirects to home page

### 6. Verify Auto-Assignment to Demo Business

```sql
-- Run in Supabase SQL Editor
SELECT 
  p.id,
  p.full_name,
  p.email,
  bu.role,
  bu.is_default,
  b.name as business_name,
  b.slug
FROM profiles p
JOIN business_users bu ON bu.user_id = p.id
JOIN businesses b ON b.id = bu.business_id
ORDER BY p.created_at DESC
LIMIT 5;
```

You should see your test user linked to "Houston Premier Plumbing" (demo-plumbing).

## Troubleshooting

### "Supabase not configured" Error

**Frontend:**
- Check `frontend/.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart frontend server after adding env vars

**Backend:**
- Check `frontdesk-backend/.env` has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Restart backend server

### "Authentication required" on Dashboard

- Clear browser cookies/localStorage
- Try logging in again
- Check browser console for errors
- Verify Supabase project is active

### "No business assigned to user" Error

Run this SQL to manually assign:

```sql
INSERT INTO business_users (business_id, user_id, role, is_default)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'YOUR_USER_ID_HERE',
  'owner',
  true
);
```

### Can't Sign Up - Email Confirmation Required

Supabase may require email confirmation by default.

**Option 1: Disable for dev**
1. Go to Supabase Dashboard → Authentication → Providers → Email
2. Uncheck "Confirm email"

**Option 2: Use Magic Link**
- Check your email for confirmation link
- Click link to verify account

### API Returns 401 Unauthorized

- Check if `Authorization` header is being sent
- Check browser Network tab → Headers
- Verify token is valid (not expired)
- Try logging out and back in

## API Reference

### Protected Endpoints

All require `Authorization: Bearer <token>` header:

```javascript
// Get user info and businesses
GET /api/auth/me
Response: {
  ok: true,
  user: { id, profile },
  currentBusiness: { id, slug, name, ... },
  businesses: [...],
  isDemo: false
}

// Get all user's businesses
GET /api/auth/businesses
Response: {
  ok: true,
  businesses: [{ id, slug, name, userRole, isDefault }],
  count: 1
}

// Get leads (uses auth context for businessId)
GET /api/leads
Response: {
  leads: [...],
  stats: { today, last7Days },
  count: 15,
  businessId: "uuid",
  isDemo: false
}

// Get appointments (uses auth context)
GET /api/appointments
Response: {
  ok: true,
  data: [...],
  count: 5,
  calendarEnabled: true
}
```

### Demo Mode (No Auth)

Works with `businessId=demo-plumbing` query param:

```javascript
// Demo chat endpoint
POST /api/message?businessId=demo-plumbing
Body: { message: "...", from: "555-1234", channel: "web" }
```

## Next Steps

Now that auth is working:

### Step 3: Full Multi-Business Support
- Add business selector dropdown (for users with multiple businesses)
- Create `/b/[slug]` public business pages
- Allow users to create new businesses (onboarding)
- Team management (invite users to businesses)

### Step 4: Enhanced Auth
- Password reset flow
- Social auth (Google, etc.)
- Two-factor authentication
- Session timeout settings

### Step 5: Business Onboarding
- New user flow: Create your own business
- Business setup wizard
- Custom branding per business
- Service area configuration

## Security Notes

1. **Never expose `service_role` key** in frontend code
2. **Row Level Security (RLS)** policies enforce business isolation
3. **JWT tokens** expire after 1 hour (Supabase default)
4. **Demo mode** is intentionally public for marketing
5. **Auth middleware** validates every protected request

## Files Modified/Created

### Backend
- ✨ NEW: `authHelper.js` (355 lines)
- 🔧 UPDATED: `index.js` (added auth imports, protected endpoints, new auth routes)

### Frontend
- ✨ NEW: `lib/supabase.js` (130 lines)
- ✨ NEW: `contexts/AuthContext.js` (80 lines)
- ✨ NEW: `pages/login.js` (220 lines)
- ✨ NEW: `pages/logout.js` (25 lines)
- 🔧 UPDATED: `pages/_app.js` (wrapped with AuthProvider)
- 🔧 UPDATED: `pages/dashboard/index.js` (uses auth, withAuth)
- 🔧 UPDATED: `pages/dashboard/leads.js` (uses auth, withAuth)
- 🔧 UPDATED: `pages/dashboard/calendar.js` (uses auth, withAuth)
- 🔧 UPDATED: `pages/dashboard/settings.js` (uses auth, withAuth)
- 🔧 UPDATED: `components/TopBar.js` (user menu with logout)

### Dependencies
- ✨ NEW: `@supabase/supabase-js` in frontend

## Summary

✅ **Supabase Auth** integrated for user authentication
✅ **Protected routes** - Dashboard requires login
✅ **Auto-assignment** - New users join demo business
✅ **Auth middleware** - Backend validates tokens
✅ **Business context** - API calls filtered by user's business
✅ **Demo mode** - Public demo chat still works
✅ **User menu** - Logout and settings access
✅ **Session management** - Persistent login across page loads

The foundation is now in place for true multi-tenant operation. Next, we can add business creation, team management, and public business pages.
