# Navigation Flows - Desk.ai MVP

**Implementation Date:** $(date +%Y-%m-%d)  
**Status:** ✅ Complete  
**Related:** Prompt 8 - Smooth Navigation Flows

## Overview

This document describes the end-to-end navigation flows for Desk.ai, ensuring users are routed to the correct pages based on their role (owner vs client) and authentication state.

## Key Principles

1. **Role-Based Routing**: Owners and clients have different home pages and navigation
2. **Centralized Logic**: All redirect logic lives in `frontend/lib/redirectAfterLogin.js`
3. **Smart Defaults**: New owners go to onboarding, returning owners to dashboard
4. **Auth-Aware Navbar**: Navigation links change based on login state and role
5. **Clear Demo Labeling**: Demo pages are clearly marked to prevent confusion

## User Flows

### New Business Owner
```
Landing Page (/) → Get Started → Signup (select "Business Owner") 
  → Create Account → Onboarding (/onboarding) 
  → Complete Setup → Dashboard (/dashboard)
```

### Returning Business Owner
```
Landing Page (/) → Sign In → Login → Dashboard (/dashboard)
```

### New Customer/Client
```
Landing Page (/) → Get Started → Signup (select "Customer") 
  → Create Account → Client Home (/client)
```

### Returning Customer/Client
```
Landing Page (/) → Sign In → Login → Client Home (/client)
```

### Demo Experience
```
Landing Page (/) → Try Demo → Demo Chat (/demo-chat/customer or /demo-chat/owner)
  [Clearly labeled with DEMO badges]
```

## Implementation Files

### 1. Core Redirect Utility
**File:** `frontend/lib/redirectAfterLogin.js` (200+ lines)

**Functions:**
- `redirectAfterLogin({ user, profile, currentBusiness, router, context })` - Main redirect logic
- `getHomeRoute(role, hasBusiness)` - Returns appropriate home for role
- `checkRouteAccess({ currentPath, role, hasBusiness, isAuthenticated })` - Route protection
- `getNavbarLinks({ isAuthenticated, role, hasBusiness })` - Dynamic navbar links

**Logic:**
```javascript
// Owner flows
if (role === 'owner') {
  if (!hasBusiness && context === 'signup') return '/onboarding';
  if (!hasBusiness) return '/onboarding';
  return '/dashboard';
}

// Client flows
if (role === 'client') {
  return '/client';
}

// Fallback
return '/dashboard';
```

### 2. Login/Signup Page
**File:** `frontend/pages/login.js`

**Changes:**
- ✅ Imports `redirectAfterLogin` and `getUserWithProfile`
- ✅ Added role selector to signup form (Owner vs Customer)
- ✅ Reads URL params for role pre-selection
- ✅ Calls `redirectAfterLogin()` after successful auth instead of hardcoded `/dashboard`
- ✅ Fetches user profile to get role before redirecting

**Code:**
```javascript
// After successful login/signup
const { profile } = await getUserWithProfile();
redirectAfterLogin({
  user,
  profile,
  currentBusiness,
  router,
  context: isSignUp ? 'signup' : 'login'
});
```

### 3. Auth Context
**File:** `frontend/contexts/AuthContext.js`

**Changes:**
- ✅ Fixed signOut redirect path: `/auth/login` → `/login`

**Code:**
```javascript
signOut: async () => {
  await supabase?.auth.signOut();
  // ... cleanup
  router.push('/login'); // Was /auth/login
}
```

### 4. Marketing Navbar
**File:** `frontend/components/marketing/Navbar.js`

**Changes:**
- ✅ Made auth-aware using `useAuth()` and `useCurrentUser()`
- ✅ Uses `getNavbarLinks()` to generate dynamic navigation
- ✅ Shows different links based on login state and role
- ✅ Handles logout action

**Navbar States:**

**Logged Out:**
- Features (anchor link)
- Pricing (anchor link)
- Marketplace
- Demo Chat
- Sign In
- Get Started (CTA)

**Logged In as Owner:**
- Dashboard
- Marketplace
- Log Out

**Logged In as Client:**
- Home (/client)
- Marketplace
- Demo Chat
- Log Out

### 5. Get Started Page
**File:** `frontend/pages/get-started.js`

**Changes:**
- ✅ Updated links from `/auth/signup` → `/login?role=owner&signup=true`
- ✅ Updated links from `/auth/login` → `/login?role=owner`
- ✅ Fixed client links similarly

### 6. Demo Chat Pages
**Files:** 
- `frontend/components/demo/CustomerChatLayout.js`
- `frontend/components/demo/OwnerChatLayout.js`

**Changes:**
- ✅ Added prominent DEMO badges at top of page
- ✅ Clear messaging: "This is a demonstration of Desk.ai"
- ✅ Different badge colors (amber for customer, purple for owner)
- ✅ Explanatory text about what to try

## Navigation Link Logic

### getNavbarLinks() Output

```javascript
// Logged out
[
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Demo Chat', href: '/demo-chat/customer' },
  { label: 'Sign In', href: '/login' },
  { label: 'Get Started', href: '/get-started', isCTA: true }
]

// Owner (with business)
[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Log Out', type: 'button' }
]

// Owner (no business - in onboarding)
[
  { label: 'Onboarding', href: '/onboarding' },
  { label: 'Log Out', type: 'button' }
]

// Client
[
  { label: 'Home', href: '/client' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Demo Chat', href: '/demo-chat/customer' },
  { label: 'Log Out', type: 'button' }
]
```

## Route Protection

### checkRouteAccess() Logic

```javascript
// If not authenticated
if (!isAuthenticated && protectedRoute) {
  return '/login';
}

// If owner trying to access client route
if (role === 'owner' && currentPath === '/client') {
  return '/dashboard';
}

// If client trying to access owner routes
if (role === 'client' && ownerRoute) {
  return '/client';
}

// If owner without business trying to access dashboard
if (role === 'owner' && !hasBusiness && currentPath === '/dashboard') {
  return '/onboarding';
}
```

## Testing Checklist

### Manual Testing (To Be Performed)

- [ ] **New Owner Signup**
  1. Go to `/get-started`
  2. Click "Create business account"
  3. Should land on `/login?role=owner&signup=true`
  4. Role should be pre-selected to "Business Owner"
  5. Complete signup
  6. Should redirect to `/onboarding`

- [ ] **Owner Login**
  1. Go to `/login`
  2. Login with owner credentials
  3. Should redirect to `/dashboard` (if business exists)
  4. Should redirect to `/onboarding` (if no business)

- [ ] **New Client Signup**
  1. Go to `/get-started`
  2. Click "Sign in to chat & marketplace" (customer card)
  3. Toggle to signup mode
  4. Role should default to "Customer"
  5. Complete signup
  6. Should redirect to `/client`

- [ ] **Client Login**
  1. Go to `/login`
  2. Login with client credentials
  3. Should redirect to `/client`

- [ ] **Navbar - Logged Out**
  1. Visit `/` while logged out
  2. Should see: Features, Pricing, Marketplace, Demo Chat, Sign In, Get Started

- [ ] **Navbar - Owner**
  1. Login as owner
  2. Visit `/`
  3. Should see: Dashboard, Marketplace, Log Out

- [ ] **Navbar - Client**
  1. Login as client
  2. Visit `/`
  3. Should see: Home, Marketplace, Demo Chat, Log Out

- [ ] **Demo Badges**
  1. Visit `/demo-chat/customer`
  2. Should see amber DEMO badge at top
  3. Visit `/demo-chat/owner`
  4. Should see purple OWNER DEMO badge at top

- [ ] **Logout**
  1. Click "Log Out" in navbar
  2. Should redirect to `/login`
  3. Session should be cleared

- [ ] **Role Protection**
  1. Login as client
  2. Try to visit `/dashboard` directly
  3. Should redirect to `/client`
  4. Login as owner
  5. Try to visit `/client` directly
  6. Should redirect to `/dashboard`

## Edge Cases Handled

1. **User already logged in visits /login**
   - Redirects to appropriate home based on role

2. **Owner without business**
   - Always redirects to `/onboarding` (not dashboard)

3. **New signup context**
   - Owner signups go to onboarding (not dashboard)
   - Client signups go to /client

4. **Invalid role in URL params**
   - Defaults to 'client' role

5. **Missing profile data**
   - Uses metadata role as fallback
   - Graceful degradation to /dashboard

## Related Documentation

- [Prompt 8 Implementation](./PROMPT_8_IMPLEMENTATION.md) - Detailed changelog
- [Business Training](./BUSINESS_TRAINING.md) - Multi-tenant configuration
- [Developer Guide](./DEV_GUIDE.md) - General development info

## Future Enhancements

### Potential Improvements

1. **Breadcrumb Navigation**: Show users where they are in the flow
2. **Progress Indicators**: For onboarding process
3. **Back Button Handling**: Smart back navigation based on flow
4. **Deep Link Preservation**: Remember where user was trying to go before login
5. **Role Switching**: Allow owners to switch to client view (and vice versa)
6. **Session Timeout**: Handle expired sessions gracefully
7. **Loading States**: Better loading indicators during redirects

### Analytics to Track

- Signup conversion by role
- Drop-off points in onboarding
- Navbar click patterns
- Demo chat engagement
- Login errors and reasons

## Code Examples

### Using redirectAfterLogin in a Custom Page

```javascript
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { redirectAfterLogin } from '../lib/redirectAfterLogin';

export default function CustomPage() {
  const router = useRouter();
  const { user, currentBusiness } = useAuth();
  const { profile } = useCurrentUser();

  const handleCustomAction = async () => {
    // After some action, redirect to appropriate home
    redirectAfterLogin({
      user,
      profile,
      currentBusiness,
      router,
      context: 'custom-action'
    });
  };

  // ...
}
```

### Using getNavbarLinks in a Custom Navbar

```javascript
import { useAuth } from '../contexts/AuthContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { getNavbarLinks } from '../lib/redirectAfterLogin';

export default function CustomNavbar() {
  const { user, businesses } = useAuth();
  const { profile } = useCurrentUser();

  const isAuthenticated = !!user;
  const role = profile?.role || null;
  const hasBusiness = businesses && businesses.length > 0;

  const navLinks = getNavbarLinks({ isAuthenticated, role, hasBusiness });

  return (
    <nav>
      {navLinks.map(link => (
        // Render link based on link.type, link.isCTA, etc.
      ))}
    </nav>
  );
}
```

### Using checkRouteAccess for Route Protection

```javascript
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { checkRouteAccess } from '../lib/redirectAfterLogin';

export default function ProtectedPage() {
  const router = useRouter();
  const { user, businesses } = useAuth();
  const { profile } = useCurrentUser();

  useEffect(() => {
    const isAuthenticated = !!user;
    const role = profile?.role || null;
    const hasBusiness = businesses && businesses.length > 0;

    const redirectPath = checkRouteAccess({
      currentPath: router.pathname,
      role,
      hasBusiness,
      isAuthenticated
    });

    if (redirectPath) {
      router.push(redirectPath);
    }
  }, [user, profile, businesses, router.pathname]);

  // ...
}
```

## Troubleshooting

### Common Issues

**Issue:** User stuck in redirect loop
- **Cause:** Profile not loading, role undefined
- **Fix:** Check getUserWithProfile() in useCurrentUser hook
- **Debug:** Console log profile in redirectAfterLogin

**Issue:** Navbar links not updating after login
- **Cause:** Auth context not refreshing
- **Fix:** Ensure AuthContext provider wraps app
- **Debug:** Check useAuth() returns updated user

**Issue:** Demo pages not showing badges
- **Cause:** Component import/render issue
- **Fix:** Check CustomerChatLayout and OwnerChatLayout
- **Debug:** Verify badge div is rendering in browser

**Issue:** Get Started links broken
- **Cause:** Old /auth/* paths still in use
- **Fix:** Search codebase for "/auth/" and update
- **Debug:** Check browser network tab for 404s

## Maintenance Notes

### When Adding New Routes

1. Update `checkRouteAccess()` with new route protection logic
2. Consider if route should appear in navbar
3. Add to `getNavbarLinks()` if user-facing
4. Update tests in this document
5. Consider role-based access requirements

### When Adding New Roles

1. Update `redirectAfterLogin()` with new role logic
2. Add new role to `getHomeRoute()`
3. Update `getNavbarLinks()` for new role
4. Update `checkRouteAccess()` for route protection
5. Update login.js role selector options
6. Update get-started.js role cards

---

**Last Updated:** $(date +%Y-%m-%d)  
**Maintainer:** Development Team  
**Status:** ✅ Ready for Testing
