# Owner Dashboard Authentication & Business Mapping

## Overview
This document explains how owner authentication and business mapping work in Frontdesk AI, with a focus on the dashboard's handling of different user states.

**Last Updated:** 2025-01-22  
**Related Files:**
- `frontend/pages/dashboard/index.js`
- `frontend/contexts/AuthContext.js`
- `frontdesk-backend/migrations/007_add_multi_tenancy.sql`

---

## Multi-Tenant Architecture

### Database Schema

#### 1. **businesses** table
Stores business entities (e.g., "Houston Premier Plumbing")
```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,  -- URL-safe identifier (e.g., 'demo-plumbing')
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  service_zip_codes JSONB,
  industry TEXT,
  is_active BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  ...
);
```

#### 2. **profiles** table
Links Supabase auth users to their profile data
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  role TEXT DEFAULT 'user',  -- Global role
  ...
);
```

#### 3. **business_users** table (Junction Table)
Many-to-many mapping: which users have access to which businesses
```sql
CREATE TABLE business_users (
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES profiles(id),
  role TEXT NOT NULL,  -- 'owner', 'manager', 'staff', 'viewer'
  is_default BOOLEAN DEFAULT false,
  PRIMARY KEY (business_id, user_id)
);
```

**Key Point:** A user can belong to **multiple businesses** with different roles in each.

---

## Authentication Flow

### 1. User Signup
**File:** `frontend/pages/auth/signup.js`

When a new user signs up:
1. Supabase creates record in `auth.users`
2. Email confirmation may be required (no `user` object returned until confirmed)
3. **No business_users record created automatically**
4. User needs to complete onboarding to create/join a business

**New User State:**
- ✅ Has Supabase auth session
- ❌ No entry in `business_users` table
- ❌ `currentBusiness` is `null`

### 2. Auth Context Business Resolution
**File:** `frontend/contexts/AuthContext.js`

```javascript
// AuthContext.loadUserBusinesses(userId)
const loadUserBusinesses = async (userId) => {
  const { data: businessUsers } = await supabase
    .from('business_users')
    .select('*, businesses(*)')
    .eq('user_id', userId);

  if (!businessUsers || businessUsers.length === 0) {
    console.warn('No businesses found for user');
    setUserBusinesses([]);
    setCurrentBusiness(null);  // ⚠️ Important: null when no business
    return;
  }

  // ... set currentBusiness to first/default business
};
```

**States:**
- **Existing Owner:** `currentBusiness` contains business object
- **New User:** `currentBusiness` is `null`
- **Multi-business User:** `currentBusiness` is the default (or first) business

### 3. Dashboard State Handling
**File:** `frontend/pages/dashboard/index.js`

The dashboard now handles **3 distinct states**:

#### State 1: Loading
```javascript
if (loading) {
  return <Spinner />;
}
```
Shows while initial auth/business resolution is happening.

#### State 2: Error
```javascript
if (error) {
  return <ErrorEmptyState message={error} />;
}
```
API call failed (e.g., backend unreachable).

#### State 3: No Business (Empty State)
```javascript
if (!currentBusiness) {
  return (
    <EmptyState
      title="No business connected"
      subtitle="Complete onboarding to start managing leads"
      action={<GetStartedButton />}
    />
  );
}
```
User is authenticated but has no `business_users` record.

#### State 4: Normal Dashboard
```javascript
return <Dashboard leads={leads} stats={stats} />;
```
User has an active business, show full dashboard.

---

## The Infinite Spinner Bug (Fixed)

### Root Cause
**Before Fix:**
```javascript
// ❌ BUG: useEffect only ran when currentBusiness exists
useEffect(() => {
  if (currentBusiness) {
    fetchData();  // Never called for new users!
  }
}, [currentBusiness]);

const fetchData = async () => {
  const businessId = getCurrentBusinessId();
  if (!businessId) {
    console.warn('No business selected');
    // ❌ BUG: Forgot to set loading=false
    return;
  }
  // ... fetch logic
};
```

**Problem:**
1. New user logs in → `currentBusiness` is `null`
2. `useEffect` condition fails → `fetchData()` never called
3. `loading` stays `true` forever
4. Infinite spinner! 🔄

### Fix Applied
```javascript
// ✅ FIXED: Always call fetchData, it handles no-business case
useEffect(() => {
  fetchData();  // Runs regardless of currentBusiness
}, [currentBusiness]);

const fetchData = async () => {
  const businessId = getCurrentBusinessId();
  if (!businessId) {
    console.warn('No business selected - user needs onboarding');
    setLoading(false);  // ✅ FIXED: Set loading to false
    setError(null);
    setStats(null);
    setRecentLeads([]);
    return;
  }
  // ... continue with normal fetch
};
```

**Result:**
- New users: loading → false → "No business" empty state ✅
- Existing owners: loading → false → dashboard with data ✅

---

## Key Functions

### `getCurrentBusinessId()`
**Location:** `AuthContext.js`

Returns the current business ID or `null` if no business selected.

```javascript
const getCurrentBusinessId = () => {
  return currentBusiness?.id || null;
};
```

### `loadUserBusinesses(userId)`
**Location:** `AuthContext.js`

Fetches all businesses a user has access to from `business_users` table.

**Returns:**
- `userBusinesses`: Array of all businesses user belongs to
- `currentBusiness`: The active/default business (or null)

### `withAuth(Component)`
**Location:** `AuthContext.js`

Higher-order component that:
1. Shows loading spinner while auth initializes
2. Redirects to `/auth/signin` if not authenticated
3. Renders protected component if authenticated

**Does NOT check for business** - that's dashboard's responsibility.

---

## Testing Checklist

### Test Case 1: New User (No Business)
**Steps:**
1. Create new Supabase account via signup
2. Confirm email (if required)
3. Navigate to `/dashboard`

**Expected:**
- ✅ No infinite spinner
- ✅ Shows "No business connected" empty state
- ✅ "Get Started" button visible
- ✅ Clicking button goes to `/onboarding`

### Test Case 2: Existing Business Owner
**Steps:**
1. Sign in with account that has `business_users` record
2. Navigate to `/dashboard`

**Expected:**
- ✅ Brief loading spinner
- ✅ Dashboard appears with stats
- ✅ Leads/appointments visible
- ✅ Metrics cards populate

### Test Case 3: Multi-Business Owner
**Steps:**
1. User with multiple businesses in `business_users`
2. Navigate to `/dashboard`

**Expected:**
- ✅ Shows dashboard for default business (or first in list)
- ✅ Business switcher available (if implemented)

### Test Case 4: API Error Handling
**Steps:**
1. Stop backend server
2. User with business logs in
3. Navigate to `/dashboard`

**Expected:**
- ✅ Error empty state appears
- ✅ Message: "Failed to load dashboard"
- ✅ Helpful subtitle with backend URL
- ✅ No infinite spinner

---

## Common Pitfalls

### ❌ Don't Check `currentBusiness` in `useEffect` Dependencies
```javascript
// WRONG - New users stuck with no data fetch
useEffect(() => {
  if (currentBusiness) fetchData();
}, [currentBusiness]);

// RIGHT - Always fetch, handle null inside fetchData
useEffect(() => {
  fetchData();
}, [currentBusiness]);
```

### ❌ Don't Forget to Set `loading=false` on Early Returns
```javascript
// WRONG - Infinite spinner
if (!businessId) return;

// RIGHT - Clear loading state
if (!businessId) {
  setLoading(false);
  return;
}
```

### ❌ Don't Auto-Create Business on Signup
The multi-tenant architecture expects users to:
1. Sign up → authenticate
2. Complete onboarding → create/join business
3. Get added to `business_users` table

**Why?** Users might be invited to join an existing business, not create their own.

---

## Future Enhancements

### Business Switcher
For users belonging to multiple businesses:
```javascript
<BusinessSwitcher
  businesses={userBusinesses}
  currentBusiness={currentBusiness}
  onSwitch={(businessId) => setCurrentBusiness(businessId)}
/>
```

### Team Invites
Allow business owners to invite team members:
```sql
INSERT INTO business_users (business_id, user_id, role)
VALUES ('...', '...', 'staff');
```

### Role-Based Permissions
Use `business_users.role` to restrict actions:
- `owner`: Full access
- `manager`: Edit settings, view all leads
- `staff`: View assigned leads only
- `viewer`: Read-only access

---

## Related Documentation
- [Email Confirmation Fix](./EMAIL_CONFIRMATION_FIX_SUMMARY.md)
- [Multi-Tenancy Migration](./frontdesk-backend/migrations/007_add_multi_tenancy.sql)
- [Supabase RLS Policies](./frontdesk-backend/migrations/007_add_multi_tenancy.sql#L240)

---

## Summary

**Before Fix:**
- New users → Infinite spinner on `/dashboard`
- `currentBusiness` null → `useEffect` skipped → `loading` never updated

**After Fix:**
- New users → "No business connected" empty state with onboarding CTA
- 3 clear states: Loading, Error, No Business, Dashboard
- Proper state transitions for all user scenarios

**Architecture:**
- Multi-tenant via `business_users` junction table
- Users can belong to multiple businesses
- Dashboard gracefully handles "no business" case
- Onboarding flow creates business + links user
