# Navigation Flows - Quick Reference

## User Flows

### 🏢 New Business Owner
```
/ → Get Started → Login (signup mode, role=owner) → /onboarding → /dashboard
```

### 🏢 Returning Business Owner  
```
/ → Sign In → Login → /dashboard
```

### 👤 New Customer/Client
```
/ → Get Started → Login (signup mode, role=client) → /client
```

### 👤 Returning Customer/Client
```
/ → Sign In → Login → /client
```

### 🎭 Demo Experience
```
/ → Demo Chat (navbar) → /demo-chat/customer (no login required)
```

---

## Route Protection Rules

### Owner-Only Routes
| Route | Auth | Business | If Not Met, Redirect To |
|-------|------|----------|------------------------|
| `/dashboard` | ✓ | ✓ | `/onboarding` (no biz) or `/login` (no auth) |
| `/onboarding` | ✓ | - | `/login` (no auth) |

### Client-Only Routes
| Route | Auth | If Not Met, Redirect To |
|-------|------|------------------------|
| `/client` | ✓ | `/login` |

### Public Routes (No Protection)
- `/` - Landing page
- `/login` - Login/signup
- `/get-started` - Role selection
- `/demo-chat/customer` - Customer demo
- `/demo-chat/owner` - Owner demo
- `/marketplace` - Business listings

### Cross-Role Redirects
| User Role | Tries to Access | Redirected To |
|-----------|----------------|---------------|
| Owner | `/client` | `/dashboard` |
| Client | `/dashboard` | `/client` |
| Client | `/onboarding` | `/client` |
| Owner (no business) | `/dashboard` | `/onboarding` |

---

## Navbar by State

### 🔓 Logged Out
```
Features | Pricing | Marketplace | Demo Chat | Sign In | [Get Started]
```

### 🏢 Owner (with business)
```
Dashboard | Marketplace | Log Out
```

### 🏢 Owner (no business)
```
Onboarding | Log Out
```

### 👤 Client
```
Home | Marketplace | Demo Chat | Log Out
```

---

## Key Functions

### `redirectAfterLogin({ user, profile, currentBusiness, router, context })`
**Location:** `frontend/lib/redirectAfterLogin.js`

**Logic:**
- Owner + no business + signup context → `/onboarding`
- Owner + no business → `/onboarding`
- Owner + has business → `/dashboard`
- Client → `/client`
- Fallback → `/dashboard`

### `getNavbarLinks({ isAuthenticated, role, hasBusiness })`
**Location:** `frontend/lib/redirectAfterLogin.js`

**Returns:** Array of navbar link objects based on auth state

### `checkRouteAccess({ currentPath, role, hasBusiness, isAuthenticated })`
**Location:** `frontend/lib/redirectAfterLogin.js`

**Returns:** Redirect path (string) or null if access allowed

---

## Testing Quick Start

1. **Test Owner Signup:**
   ```
   Visit: http://localhost:3003/get-started
   Click: "Create business account"
   Expected: Lands on /login?role=owner&signup=true
   Complete signup
   Expected: Redirects to /onboarding
   ```

2. **Test Client Signup:**
   ```
   Visit: http://localhost:3003/get-started
   Click: "Sign in to chat & marketplace"
   Toggle to signup
   Expected: Role defaults to "Customer"
   Complete signup
   Expected: Redirects to /client
   ```

3. **Test Role Protection:**
   ```
   Login as client
   Try: http://localhost:3003/dashboard
   Expected: Redirects to /client
   
   Login as owner
   Try: http://localhost:3003/client
   Expected: Redirects to /dashboard
   ```

4. **Test Navbar:**
   ```
   Logged out: Should show Get Started, Sign In
   Login as owner: Should show Dashboard, Log Out
   Login as client: Should show Home, Demo Chat, Log Out
   ```

5. **Test Demo:**
   ```
   Visit: http://localhost:3003/demo-chat/customer
   Expected: No login required
   Expected: Amber DEMO badge visible
   Expected: Clear instructions
   ```

---

## Files Changed

### Created
- `frontend/lib/redirectAfterLogin.js` (220 lines)
- `NAVIGATION_FLOWS.md` (documentation)
- `PROMPT_8_IMPLEMENTATION.md` (summary)
- `FLOWS_QUICK_REF.md` (this file)

### Modified
- `frontend/pages/login.js` - Role selector, redirect logic
- `frontend/contexts/AuthContext.js` - Fixed signOut path
- `frontend/components/marketing/Navbar.js` - Auth-aware
- `frontend/pages/get-started.js` - Fixed routes
- `frontend/components/demo/CustomerChatLayout.js` - Demo badge
- `frontend/components/demo/OwnerChatLayout.js` - Demo badge

---

## Common Issues & Fixes

**Issue:** User redirects to wrong page after login  
**Fix:** Check profile.role is set correctly in database

**Issue:** Navbar not updating after login  
**Fix:** Verify AuthContext is wrapping app, check useAuth() hook

**Issue:** Redirect loop  
**Fix:** Check profile loads before redirectAfterLogin() is called

**Issue:** Demo badge not showing  
**Fix:** Verify CustomerChatLayout/OwnerChatLayout components render

**Issue:** /auth/login 404 error  
**Fix:** All fixed - now uses /login (no /auth prefix)

---

**Last Updated:** November 24, 2025  
**Status:** ✅ Ready for Testing
