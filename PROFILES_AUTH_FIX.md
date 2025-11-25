# Profiles Table Authentication Fix

## Problem

When attempting to sign up as a business owner, Supabase returned the error:

```
"Could not find the table 'public.profiles' in the schema cache"
```

This error prevented users from creating accounts and completing the signup flow.

## Root Cause

The `profiles` table was defined in migration `007_add_multi_tenancy.sql`, but it was **missing a critical RLS policy for INSERT operations**. The existing migration only included:

- ✅ SELECT policy (users can view their own profile)
- ✅ UPDATE policy (users can update their own profile)  
- ❌ **INSERT policy was MISSING** (users couldn't create profiles during signup)

Additionally, there was no guarantee the table existed in the `public` schema in your Supabase database.

## Solution

Created migration `009_fix_profiles_rls.sql` that:

1. **Ensures the `public.profiles` table exists** (idempotent CREATE TABLE IF NOT EXISTS)
2. **Adds the missing INSERT policy** for Row Level Security
3. **Includes all necessary RLS policies** (SELECT, INSERT, UPDATE)
4. **Adds proper indexes** for performance
5. **Includes `updated_at` trigger** for automatic timestamp updates

## Files Changed

### New Files Created

1. **`/frontdesk-backend/migrations/009_fix_profiles_rls.sql`**  
   - Full migration file with comments and verification queries
   - Safe to run multiple times (idempotent)

2. **`/PROFILES_TABLE_SETUP.sql`**  
   - Standalone SQL file you can run directly in Supabase SQL Editor
   - Contains the exact same schema and policies as the migration
   - Includes verification queries to confirm setup

### Modified Files

3. **`/frontend/pages/auth/signup.js`**  
   - Improved error handling for profile creation
   - Better error messages when profiles table is missing or has permission issues
   - Added email field to profile creation

## How to Apply the Fix

### Option A: Run in Supabase SQL Editor (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Open the file `/PROFILES_TABLE_SETUP.sql` from this repo
4. Copy and paste the entire contents into the SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Verify the output shows:
   - ✅ profiles table created
   - ✅ RLS enabled  
   - ✅ Three policies created (SELECT, INSERT, UPDATE)

### Option B: Run Migration File

If you have a migration runner set up:

```bash
# Run the migration
psql $DATABASE_URL -f frontdesk-backend/migrations/009_fix_profiles_rls.sql
```

## Profiles Table Schema

```sql
public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('owner', 'client', 'user', 'admin', 'super_admin')),
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Key Fields

- **`id`**: Foreign key to `auth.users.id`, automatically deletes profile when user is deleted
- **`role`**: Determines user type - `owner` (business owner) or `client` (customer)
- **`email`**: Cached from auth.users for easier querying
- **`preferences`**: JSONB field for storing user settings (theme, notifications, etc.)
- **`updated_at`**: Automatically updated via trigger on any row update

## RLS Policies Explained

The table has Row Level Security (RLS) enabled with three policies:

### 1. SELECT Policy: "Users can view their own profile"
```sql
POLICY FOR SELECT USING (auth.uid() = id)
```
**What it does:** Users can only read their own profile row, not other users' data.

### 2. INSERT Policy: "Users can insert their own profile" ⭐ NEW
```sql
POLICY FOR INSERT WITH CHECK (auth.uid() = id)
```
**What it does:** Users can create a profile, but only for their own user ID (prevents impersonation).  
**Why it's critical:** Without this, `upsertProfile()` fails during signup!

### 3. UPDATE Policy: "Users can update their own profile"
```sql
POLICY FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id)
```
**What it does:** Users can modify their own profile, but can't change their `id` or update someone else's profile.

## Security Notes

✅ **RLS is enabled** - All access to profiles table goes through policies  
✅ **No cross-user access** - Users can only see/modify their own profile  
✅ **Cascade delete** - When auth.users row is deleted, profile is automatically deleted  
✅ **Role validation** - CHECK constraint ensures role is one of allowed values  
✅ **No service role bypass** - Policies apply to both authenticated users and anon key

## Testing Checklist

Run through this checklist to verify everything works:

### 1. ✅ Run the Migration in Supabase

```sql
-- Open Supabase SQL Editor and run PROFILES_TABLE_SETUP.sql
-- Then verify with these queries:

-- Check table exists in public schema
SELECT schemaname, tablename FROM pg_tables WHERE tablename = 'profiles';
-- Expected: schemaname = 'public', tablename = 'profiles'

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';
-- Expected: rowsecurity = true

-- List all policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
-- Expected: 3 rows (SELECT, INSERT, UPDATE)
```

### 2. ✅ Test Owner Signup Flow

1. Open `http://localhost:3000/auth/signup?role=owner` (or your deployed URL)
2. Enter email: `testowner@example.com`
3. Enter password: `password123`
4. Click **Create Account**
5. **Expected behavior:**
   - No "Could not find the table 'public.profiles'" error
   - User is redirected to `/onboarding`
   - Console shows: `✅ Auth user created` → `✅ Profile created successfully` → `🏢 Redirecting owner to onboarding...`

### 3. ✅ Verify User Created in Supabase

```sql
-- Check auth.users
SELECT id, email, created_at FROM auth.users WHERE email = 'testowner@example.com';

-- Check public.profiles (should have matching row)
SELECT id, email, role, full_name, created_at 
FROM public.profiles 
WHERE email = 'testowner@example.com';
-- Expected: role = 'owner'
```

### 4. ✅ Complete Onboarding Wizard

1. After signup redirect, you should land on `/onboarding`
2. Fill out:
   - Business Name (e.g., "Test Plumbing")
   - Industry (e.g., "Plumbing")
   - Phone, Email, ZIP codes
3. Click through the wizard steps
4. Complete onboarding
5. **Expected:** Redirect to `/dashboard`

### 5. ✅ Verify Business Created

```sql
-- Check businesses table
SELECT id, slug, name, industry, onboarding_completed 
FROM businesses 
WHERE name = 'Test Plumbing';
-- Expected: onboarding_completed = true

-- Check business_users relationship
SELECT bu.role, b.name, p.email
FROM business_users bu
JOIN businesses b ON bu.business_id = b.id
JOIN profiles p ON bu.user_id = p.id
WHERE p.email = 'testowner@example.com';
-- Expected: role = 'owner'
```

### 6. ✅ Test Login Flow

1. Log out (if logged in)
2. Go to `http://localhost:3000/auth/login`
3. Sign in with `testowner@example.com` / `password123`
4. **Expected:**
   - No errors
   - Console shows: `✅ Login successful` → `👤 User role: owner` → `✅ Owner has business, redirecting to dashboard...`
   - Redirects to `/dashboard`

### 7. ✅ Test Client Signup (Optional)

1. Sign up with `?role=client` parameter
2. Verify profile created with `role = 'client'`
3. Should redirect to marketplace or client page (depending on `MARKETPLACE_ENABLED` flag)

## Error Messages

After this fix, you should see **better error messages** if something goes wrong:

| Old Error | New Error (User-Friendly) |
|-----------|--------------------------|
| `Could not find the table 'public.profiles'` | `Database table missing. Please contact support with error: profiles table not found` |
| `new row violates row-level security policy` | `Permission error creating profile. Please contact support.` |
| Generic Supabase error | Clear indication of what failed (auth creation vs profile creation) |

## Multi-Tenant Safety

This fix maintains the existing multi-tenant architecture:

- ✅ **Profiles** link to `auth.users` (1:1 relationship)
- ✅ **Businesses** are separate entities
- ✅ **Business_users** junction table links users to businesses (many-to-many)
- ✅ **No changes** to existing business, leads, or appointments tables
- ✅ **RLS policies** ensure business data isolation

## Troubleshooting

### Issue: Still seeing "table not found" error

**Cause:** Migration not yet run in Supabase  
**Fix:** Run `PROFILES_TABLE_SETUP.sql` in Supabase SQL Editor

### Issue: "new row violates row-level security policy for table 'profiles'"

**Cause:** INSERT policy missing or incorrect  
**Fix:** 
```sql
-- Check policies exist
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
-- Should show 3 policies, one with cmd = 'INSERT'

-- If missing, re-run the migration
```

### Issue: Profile created but signup still fails

**Cause:** Different error in business creation or onboarding flow  
**Fix:** Check browser console for detailed error logs (we added emoji logging for debugging)

### Issue: User exists but no profile row

**Cause:** User signed up before this fix was applied  
**Fix:** Manually create profile or run this:
```sql
INSERT INTO public.profiles (id, email, role, full_name)
SELECT id, email, 'owner', SPLIT_PART(email, '@', 1)
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = au.id);
```

## Next Steps

After applying this fix:

1. ✅ Test owner signup end-to-end
2. ✅ Test login for existing users
3. ✅ Verify onboarding flow works
4. ✅ Check dashboard loads correctly
5. 🚀 Deploy to production

## Related Files

- `/frontend/lib/supabase.js` - Auth helper functions (`upsertProfile`, `getUserProfile`)
- `/frontdesk-backend/authHelper.js` - Backend auth functions (if using backend)
- `/frontdesk-backend/migrations/007_add_multi_tenancy.sql` - Original profiles table definition (incomplete)
- `/DATABASE_SCHEMA.sql` - Full schema reference
- `/SUPABASE_ROLE_MIGRATION.sql` - Existing migration for adding roles

## Support

If you encounter issues after applying this fix:

1. Check the Supabase logs (Dashboard → Logs → Postgres Logs)
2. Verify RLS policies with the verification queries above
3. Check browser console for detailed error messages (we added emoji logging)
4. Ensure `.env.local` has correct Supabase credentials

---

**Migration Author:** GitHub Copilot  
**Date:** November 25, 2025  
**Issue:** "Could not find the table 'public.profiles' in the schema cache"  
**Fix:** Added missing INSERT RLS policy to profiles table
