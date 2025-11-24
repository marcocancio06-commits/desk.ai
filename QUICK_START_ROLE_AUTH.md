# Role-Based Auth - Quick Start Guide

## 🚀 What Was Implemented

Split authentication flows for **business owners** vs **customers** using the same Supabase project.

---

## 📋 Before You Start

### 1. Run the Database Migration
In your Supabase SQL Editor, run:
```sql
-- File: SUPABASE_ROLE_MIGRATION.sql
-- This adds the 'role' column to profiles table
```

Or manually:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client' CHECK (role IN ('owner', 'client'));
UPDATE profiles SET role = 'owner' WHERE role IS NULL OR role = 'client';
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
```

---

## 🧪 Quick Test

### Create a Business Owner Account:
1. Go to: `http://localhost:3000/get-started`
2. Click **"Create business account"** (blue card)
3. Sign up: `owner@test.com` / `test123`
4. ✅ Should redirect to `/onboarding`

### Create a Customer Account:
1. Go to: `http://localhost:3000/get-started`
2. Click **"Sign in to chat & marketplace"** (purple card)
3. Click "Sign up" → Sign up: `client@test.com` / `test123`
4. ✅ Should redirect to `/client`

### Test Route Protection:
1. Sign in as customer (`client@test.com`)
2. Try to visit: `http://localhost:3000/dashboard`
3. ✅ Should redirect to `/client` with message

---

## 📁 Files Created/Modified

### New Files:
- ✅ `SUPABASE_ROLE_MIGRATION.sql` - Database migration
- ✅ `frontend/hooks/useCurrentUser.js` - Role-based auth hook
- ✅ `frontend/lib/withOwnerAuth.js` - Owner route protection HOC
- ✅ `frontend/pages/client.js` - Customer home page
- ✅ `ROLE_BASED_AUTH_IMPLEMENTATION.md` - Full documentation

### Modified Files:
- ✅ `frontend/lib/supabase.js` - Added getUserWithProfile(), upsertProfile(), checkUserRole()
- ✅ `frontend/pages/auth/signup.js` - Added role parameter support
- ✅ `frontend/pages/auth/login.js` - Added role-based redirects
- ✅ `frontend/pages/dashboard/index.js` - Added owner protection
- ✅ `frontend/pages/onboarding.js` - Added owner protection

---

## 🔑 Key Functions

### Check user role:
```javascript
import { getUserWithProfile } from '../lib/supabase';

const { user, profile } = await getUserWithProfile();
console.log(profile.role); // 'owner' or 'client'
```

### Protect a page (owner-only):
```javascript
import { withOwnerAuth } from '../lib/withOwnerAuth';

function MyPage() { /* ... */ }

export default withOwnerAuth(MyPage);
```

### Use in a component:
```javascript
import { useCurrentUser } from '../hooks/useCurrentUser';

function MyComponent() {
  const { user, profile, isOwner, isClient } = useCurrentUser();
  
  return (
    <div>
      {isOwner && <OwnerContent />}
      {isClient && <ClientContent />}
    </div>
  );
}
```

---

## 🔄 User Flows

### Owner: Landing → GetStarted → Signup → Onboarding → Dashboard
### Client: Landing → GetStarted → Login/Signup → Client Home

---

## ✅ Verification Checklist

- [ ] SQL migration executed in Supabase
- [ ] Existing users still work (should be 'owner' role)
- [ ] Owner signup creates role='owner' profile
- [ ] Client signup creates role='client' profile
- [ ] Owner login redirects to /dashboard
- [ ] Client login redirects to /client
- [ ] Client blocked from /dashboard (redirects to /client)
- [ ] /onboarding blocked from clients
- [ ] /client page shows chat & directory cards

---

## 📖 Full Documentation

See `ROLE_BASED_AUTH_IMPLEMENTATION.md` for:
- Complete API reference
- Detailed testing guide
- Troubleshooting tips
- Security notes
- Future enhancement ideas

---

## 🆘 Troubleshooting

**User redirected wrong?**
```sql
-- Check their role
SELECT id, email, role FROM profiles 
JOIN auth.users ON profiles.id = auth.users.id;

-- Fix if needed
UPDATE profiles SET role = 'owner' WHERE id = '<user-id>';
```

**Profile missing?**
```sql
-- Create missing profile
INSERT INTO profiles (id, role, full_name) 
VALUES ('<user-id>', 'owner', 'Test User');
```

---

That's it! You now have separate auth flows for owners and clients. 🎉
