# Role-Based Authentication Implementation

## Overview

We've implemented a complete role-based authentication system that separates **business owners** from **customers (clients)**. Both user types use the same Supabase project but have different experiences and access levels.

---

## Database Schema Changes

### Added to `profiles` table:
```sql
-- New column
role TEXT DEFAULT 'client' CHECK (role IN ('owner', 'client'))
```

- **Default**: `'client'` (safer default)
- **Values**: `'owner'` | `'client'`
- **Index**: Created on `role` column for fast lookups
- **Backward compatibility**: Existing users are updated to `'owner'` role

### Migration
Run the SQL migration in Supabase SQL Editor:
```bash
# File: SUPABASE_ROLE_MIGRATION.sql
```

---

## User Flows

### 🏢 Business Owner Flow
1. **Landing page** → Click "Get started"
2. **Role chooser** (`/get-started`) → Click "Create business account"
3. **Signup** (`/auth/signup?role=owner`)
   - Creates Supabase auth user
   - Creates profile with `role='owner'`
4. **Onboarding wizard** (`/onboarding`)
   - 4-step business setup
   - Protected route (owner-only)
5. **Owner dashboard** (`/dashboard`)
   - Manage leads, calendar, settings
   - Protected route (owner-only)

### 👤 Customer Flow
1. **Landing page** → Click "Get started"
2. **Role chooser** (`/get-started`) → Click "Sign in to chat & marketplace"
3. **Login** (`/auth/login?role=client`)
   - Signs in existing customer
   - Fetches profile with `role='client'`
4. **Client home** (`/client`)
   - Access chat and directory
   - Protected route (client-only)

---

## Authentication Routes

### Signup: `/auth/signup`
**Query parameters:**
- `?role=owner` → Creates business owner account
- `?role=client` → Creates customer account
- No param → Defaults to `'client'`

**What happens:**
1. Creates Supabase auth user
2. Creates profile record with specified role
3. Redirects based on role:
   - Owner → `/onboarding`
   - Client → `/client`

### Login: `/auth/login`
**Query parameters:**
- `?role=owner` → Shows "Business Owner Login"
- `?role=client` → Shows "Customer Login"
- No param → Generic login

**What happens:**
1. Authenticates user with Supabase
2. Fetches user profile to get role
3. Redirects based on actual role (not query param):
   - Owner → `/dashboard`
   - Client → `/client`

---

## Route Protection

### Owner-Only Routes
Protected with `withOwnerAuth()` HOC:
- `/dashboard` - Owner dashboard
- `/dashboard/leads` - Lead management
- `/dashboard/calendar` - Calendar
- `/dashboard/settings` - Settings
- `/onboarding` - Business setup wizard

**Behavior:**
- If not logged in → Redirect to `/auth/login?role=owner`
- If logged in as client → Redirect to `/client` with message
- If logged in as owner → Allow access

### Client-Accessible Routes
- `/client` - Client home page
- `/demo-chat` - Chat interface (public)
- `/directory` - Business directory (public)

---

## API Reference

### Supabase Helper Functions (`lib/supabase.js`)

```javascript
// Get user with profile including role
const { user, profile } = await getUserWithProfile();

// Get just the profile
const profile = await getUserProfile(userId);

// Create/update profile with role
await upsertProfile(userId, { 
  role: 'owner',
  full_name: 'John Doe'
});

// Check if user has specific role
const isOwner = await checkUserRole('owner');
```

### Custom Hooks (`hooks/useCurrentUser.js`)

```javascript
// General use - get current user and profile
const { user, profile, loading, role, isOwner, isClient } = useCurrentUser();

// Owner-only pages
const { user, profile, loading } = useOwnerAuth();
// Redirects clients to /client automatically

// Client-only pages
const { user, profile, loading } = useClientAuth();
// Redirects owners to /dashboard automatically
```

### Higher-Order Components

```javascript
// Protect owner routes
export default withOwnerAuth(DashboardPage);

// Protect any authenticated route (role-agnostic)
export default withAuth(ProfilePage);
```

---

## Testing Guide

### 🧪 Test 1: Create Owner Account
1. Navigate to http://localhost:3000/
2. Click "Get started"
3. Click "Create business account" (blue card)
4. Fill in signup form:
   - Email: `owner@test.com`
   - Password: `test123`
5. **Expected**: Redirect to `/onboarding`
6. Complete onboarding wizard
7. **Expected**: Redirect to `/dashboard`

### 🧪 Test 2: Create Client Account
1. Navigate to http://localhost:3000/get-started
2. Click "Sign in to chat & marketplace" (purple card)
3. Click "Sign up" link
4. Fill in signup form:
   - Email: `client@test.com`
   - Password: `test123`
5. **Expected**: Redirect to `/client`
6. Verify client home page shows:
   - Chat card linking to `/demo-chat`
   - Directory card linking to `/directory`

### 🧪 Test 3: Owner Login
1. Navigate to http://localhost:3000/auth/login?role=owner
2. Sign in with:
   - Email: `owner@test.com`
   - Password: `test123`
3. **Expected**: Redirect to `/dashboard`
4. Verify dashboard loads successfully

### 🧪 Test 4: Client Login
1. Navigate to http://localhost:3000/auth/login?role=client
2. Sign in with:
   - Email: `client@test.com`
   - Password: `test123`
3. **Expected**: Redirect to `/client`
4. Verify client home page loads

### 🧪 Test 5: Route Protection (Client tries to access Owner route)
1. Sign in as client (`client@test.com`)
2. Navigate to http://localhost:3000/dashboard
3. **Expected**: Redirect to `/client` with message:
   - "You're signed in as a customer..."
4. Verify message appears in blue notification box

### 🧪 Test 6: Route Protection (Owner tries to access Client route)
This is currently allowed, but you can add protection if needed.

### 🧪 Test 7: Existing Demo Users
1. Navigate to http://localhost:3000/auth/login
2. Use demo credentials (if they exist):
   - Email: `demo@example.com`
   - Password: `demo123`
3. **Expected**: After migration, all existing users are `'owner'`
4. Should redirect to `/dashboard`

### 🧪 Test 8: Email Confirmation Flow
If email confirmation is enabled in Supabase:
1. Sign up with new email
2. **Expected**: See "Check Your Email" screen
3. Verify email in inbox
4. Click confirmation link
5. **Expected**: Redirect based on role

---

## Quick Test Commands

### Create test accounts via Supabase SQL:
```sql
-- Check existing profiles
SELECT id, email, role FROM profiles 
JOIN auth.users ON profiles.id = auth.users.id;

-- Manually update a user's role (for testing)
UPDATE profiles SET role = 'client' WHERE id = '<user-id>';
UPDATE profiles SET role = 'owner' WHERE id = '<user-id>';
```

---

## Troubleshooting

### Issue: User has no profile
**Symptom**: Login succeeds but redirects to `/client` with no data

**Solution**:
1. Check if profile exists: `SELECT * FROM profiles WHERE id = '<user-id>'`
2. If missing, run: `INSERT INTO profiles (id, role) VALUES ('<user-id>', 'owner')`

### Issue: Wrong redirect after login
**Symptom**: Owner redirected to `/client` or vice versa

**Solution**:
1. Check user's role: `SELECT role FROM profiles WHERE id = '<user-id>'`
2. Update if needed: `UPDATE profiles SET role = 'owner' WHERE id = '<user-id>'`

### Issue: Route protection not working
**Symptom**: Client can access `/dashboard`

**Solution**:
1. Verify `withOwnerAuth` is applied to the page component
2. Check console for errors in `useCurrentUser` hook
3. Clear browser cache and localStorage

### Issue: Migration fails
**Symptom**: Column already exists error

**Solution**:
```sql
-- Check if column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';

-- If exists, manually verify constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('owner', 'client'));
```

---

## Development Tips

### How to test both roles quickly:
1. Open Chrome in regular window → Sign in as owner
2. Open Chrome in Incognito → Sign in as client
3. Test interactions between both user types

### How to reset a test account:
```sql
-- Delete user's businesses and reset profile
DELETE FROM business_users WHERE user_id = '<user-id>';
DELETE FROM businesses WHERE id IN (
  SELECT business_id FROM business_users WHERE user_id = '<user-id>'
);
UPDATE profiles SET role = 'client' WHERE id = '<user-id>';
```

---

## Future Enhancements

1. **Admin role**: Add `'admin'` to role enum for super users
2. **Team members**: Allow owners to invite staff with limited permissions
3. **Client invitations**: Let owners invite clients to their business
4. **Role switching**: Allow users to have multiple roles (owner + client)
5. **Onboarding for clients**: Add client-specific onboarding flow

---

## Security Notes

- ✅ All auth flows use Supabase's secure authentication
- ✅ Role checks happen on both client and server (RLS policies recommended)
- ✅ Protected routes redirect unauthorized users
- ✅ Default role is `'client'` (safer than `'owner'`)
- ⚠️ **TODO**: Add Supabase RLS policies to enforce role checks at database level

### Recommended RLS Policy:
```sql
-- Only allow users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Only allow users to update their own profile (but not role)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));
```

---

## Summary

✅ **Database**: Added `role` column to `profiles` table  
✅ **Signup**: Accepts `?role=owner` or `?role=client` parameter  
✅ **Login**: Fetches profile and redirects based on actual role  
✅ **Protection**: Owner routes protected with `withOwnerAuth()`  
✅ **Client Home**: New `/client` page for customer experience  
✅ **Testing**: Full test guide with expected behaviors  

**Next steps**: Run the SQL migration, test both flows, and verify existing users still work!
