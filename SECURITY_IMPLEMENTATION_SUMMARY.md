# Multi-Tenant Security Implementation Summary

**Date:** November 22, 2025  
**Version:** 1.0  
**Status:** ✅ Complete

---

## Overview

This document summarizes the comprehensive multi-tenant security and data isolation implementation for Desk.ai. All endpoints now enforce strict business_id validation and ownership verification to prevent cross-tenant data access.

---

## Security Architecture

### Core Principles

1. **business_id Required** - Every data-modifying operation requires a valid business_id
2. **Ownership Verification** - Users can only access businesses they own or manage (via business_users table)
3. **Database Isolation** - All queries filter by business_id to prevent data leakage
4. **Public Endpoint Validation** - Public-facing endpoints verify business exists and is active
5. **Role-Based Access** - Team invites require owner/manager permissions

### Security Layers

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: API Request Validation                        │
│ - business_id presence check                           │
│ - Business exists and is_active=true                   │
├─────────────────────────────────────────────────────────┤
│ Layer 2: Authentication & Authorization                │
│ - requireAuth: Verify Supabase JWT token              │
│ - requireBusiness: User has business assignment       │
│ - requireBusinessOwnership: User owns requested biz   │
├─────────────────────────────────────────────────────────┤
│ Layer 3: Data Access Verification                     │
│ - verifyBusinessAccess(): Check business_users table  │
│ - Per-resource ownership check (lead, appointment)    │
├─────────────────────────────────────────────────────────┤
│ Layer 4: Database Query Filtering                     │
│ - All queries include WHERE business_id = $1          │
│ - No cross-business data exposure                     │
└─────────────────────────────────────────────────────────┘
```

---

## Files Modified

### Backend Files

#### 1. `frontdesk-backend/authHelper.js`

**Added Functions:**
- `verifyBusinessAccess(userId, businessId)` - Checks business_users table for membership
- `requireBusinessOwnership` - Express middleware that verifies user owns the requested business

**Key Changes:**
```javascript
// New middleware to enforce business ownership
async function requireBusinessOwnership(req, res, next) {
  const context = req.authContext;
  
  if (!context || !context.userId) {
    return res.status(401).json({
      ok: false,
      error: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
  }

  const requestedBusinessId = req.params.businessId || req.query.businessId || req.body?.businessId;
  
  if (!requestedBusinessId) {
    return res.status(400).json({
      ok: false,
      error: 'business_id required',
      code: 'BUSINESS_ID_REQUIRED'
    });
  }

  const { hasAccess, role } = await verifyBusinessAccess(context.userId, requestedBusinessId);
  
  if (!hasAccess) {
    return res.status(403).json({
      ok: false,
      error: 'Access denied - you do not have permission to access this business',
      code: 'FORBIDDEN'
    });
  }

  req.authContext.verifiedBusinessId = requestedBusinessId;
  req.authContext.businessRole = role;
  
  next();
}
```

**Exports Added:**
- `requireBusinessOwnership`
- `verifyBusinessAccess`

---

#### 2. `frontdesk-backend/index.js`

**Endpoints Secured:**

##### Public Endpoints (business_id required)

**POST /api/message** - Chat message handling
- ✅ Requires business_id in request body
- ✅ Verifies business exists and is_active=true
- ✅ Creates lead scoped to business_id
- ✅ Validates lead.business_id matches request
- ✅ Returns 400 if business_id missing
- ✅ Returns 404 if business not found/inactive
- ✅ Logs cross-tenant data leak attempts

```javascript
// SECURITY: business_id is REQUIRED
if (!businessId) {
  return res.status(400).json({ 
    error: 'business_id required',
    code: 'BUSINESS_ID_REQUIRED'
  });
}

// Verify business exists and is active
const { data: business, error: businessError } = await supabase
  .from('businesses')
  .select('id, is_active')
  .eq('id', businessId)
  .eq('is_active', true)
  .single();

if (businessError || !business) {
  return res.status(404).json({
    error: 'Business not found or inactive',
    code: 'BUSINESS_NOT_FOUND'
  });
}
```

##### Protected Endpoints (auth + ownership required)

**GET /api/leads** - List leads
- ✅ Middleware: `requireBusiness`
- ✅ Filters by authenticated user's business_id
- ✅ Returns stats scoped to business

**PATCH /api/leads/:id** - Update lead
- ✅ Middleware: `requireAuth`, `requireBusinessOwnership`
- ✅ Gets lead first to verify business_id
- ✅ Compares lead.business_id with user's verifiedBusinessId
- ✅ Returns 403 if mismatch (logged as security event)

```javascript
// SECURITY: Verify lead belongs to the authenticated user's business
if (lead.business_id !== verifiedBusinessId) {
  logger.warn('Attempted cross-tenant lead access', {
    userId: req.authContext.userId,
    requestedLeadId: id,
    leadBusinessId: lead.business_id,
    userBusinessId: verifiedBusinessId
  });
  return res.status(403).json({
    error: 'Access denied - lead belongs to different business',
    code: 'FORBIDDEN'
  });
}
```

**GET /api/leads/:id/timeline** - Lead timeline
- ✅ Middleware: `requireAuth`
- ✅ Gets lead first to check business_id
- ✅ Calls `verifyBusinessAccess()` to confirm ownership

**GET /api/leads/:id/events** - Lead events
- ✅ Middleware: `requireAuth`
- ✅ Ownership verification via `verifyBusinessAccess()`

**POST /api/leads/:id/status** - Update lead status
- ✅ Middleware: `requireAuth`
- ✅ Ownership verification before update

**POST /api/leads/:id/notes** - Add note to lead
- ✅ Middleware: `requireAuth`
- ✅ Ownership verification before adding note

**POST /api/leads/:id/tags** - Add tag to lead
- ✅ Middleware: `requireAuth`
- ✅ Ownership verification before adding tag

**DELETE /api/leads/:id/tags/:tag** - Remove tag
- ✅ Middleware: `requireAuth`
- ✅ Ownership verification before removal

**PUT /api/leads/:id** - Update lead with event
- ✅ Middleware: `requireAuth`
- ✅ Ownership verification before update

**GET /api/summary** - Daily summary
- ✅ Middleware: `requireBusiness`
- ✅ Uses authenticated user's business_id
- ✅ All stats filtered by business_id

**GET /api/appointments** - List appointments
- ✅ Middleware: `requireBusiness`
- ✅ Filters by authenticated user's business_id

**POST /api/appointments** - Create appointment
- ✅ Middleware: `requireBusiness`
- ✅ Uses authBusinessId from context

**PATCH /api/appointments/:id** - Update appointment
- ✅ Middleware: `requireAuth`
- ✅ Gets appointment first to verify business_id
- ✅ Calls `verifyBusinessAccess()` to confirm ownership
- ✅ Logs cross-tenant attempts

**GET /api/appointments/:id/conflicts** - Get conflicts
- ✅ Middleware: `requireAuth`
- ✅ Gets appointment first to verify business_id
- ✅ Ownership verification via `verifyBusinessAccess()`

**POST /api/conflicts/:id/resolve** - Resolve conflict
- ✅ Middleware: `requireAuth`
- ✅ Gets conflict, then appointment to verify business_id
- ✅ Ownership verification before resolution

**GET /api/business/:businessId/team** - Get team members
- ✅ Middleware: `requireAuth`, `requireBusinessOwnership`
- ✅ Uses verifiedBusinessId from middleware
- ✅ Only returns team for owned business

**POST /api/business/:businessId/invite** - Invite team member
- ✅ Middleware: `requireAuth`, `requireBusinessOwnership`
- ✅ Checks businessRole for owner/manager permissions
- ✅ Returns 403 if insufficient permissions
- ✅ Logs invite with inviter userId

```javascript
// SECURITY: Only owners and managers can invite team members
if (businessRole !== 'owner' && businessRole !== 'manager') {
  return res.status(403).json({
    ok: false,
    error: 'Only owners and managers can invite team members',
    code: 'INSUFFICIENT_PERMISSIONS'
  });
}
```

**POST /api/twilio/sms/outbound** - Send SMS
- ✅ Middleware: `requireAuth`
- ✅ Gets lead first to verify business_id
- ✅ Ownership verification via `verifyBusinessAccess()`

**GET /api/leads/:leadId/sms** - Get SMS messages
- ✅ Middleware: `requireAuth`
- ✅ Gets lead first to verify business_id
- ✅ Ownership verification via `verifyBusinessAccess()`

---

#### 3. `frontdesk-backend/db.js`

**Functions Added:**

```javascript
/**
 * Get a single appointment by ID
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<object|null>} Appointment object or null
 */
async function getAppointmentById(appointmentId) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw error;
  }

  return data;
}

/**
 * Get a single conflict by ID
 * @param {string} conflictId - Conflict ID
 * @returns {Promise<object|null>} Conflict object or null
 */
async function getConflictById(conflictId) {
  const { data, error } = await supabase
    .from('google_calendar_conflicts')
    .select('*')
    .eq('id', conflictId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw error;
  }

  return data;
}
```

**Exports Added:**
- `getAppointmentById`
- `getConflictById`

**Existing Security Verified:**
- ✅ `getAllLeads(businessId, filters)` - Filters by business_id
- ✅ `getLeadStats(businessId, daysAgo)` - Filters by business_id
- ✅ `getAppointmentsByBusiness(businessId, filters)` - Filters by business_id
- ✅ `getLeadByPhone(businessId, phone)` - Scoped to business_id
- ✅ `createLead({ businessId, ... })` - Requires business_id
- ✅ `createAppointment({ businessId, ... })` - Requires business_id

---

### Frontend Files

#### Frontend API Call Audit

**Status:** ✅ Already Secured in Step 6

All frontend pages pass `businessId` in API requests:

- ✅ `frontend/pages/dashboard/index.js` - `?businessId=${businessId}`
- ✅ `frontend/pages/dashboard/leads.js` - `?businessId=${businessId}`
- ✅ `frontend/pages/dashboard/calendar.js` - `?businessId=${businessId}`
- ✅ `frontend/pages/dashboard/settings.js` - Uses `currentBusiness.id`
- ✅ `frontend/pages/b/[slug].js` - Passes `business.id` from API response

---

## API Endpoint Security Matrix

| Endpoint | Auth | business_id | Ownership Check | Error Codes |
|----------|------|-------------|-----------------|-------------|
| POST /api/message | ❌ Public | ✅ Required | ✅ Business exists | 400, 404 |
| GET /api/leads | ✅ Required | ✅ Required | ✅ Ownership | 400, 401, 403 |
| PATCH /api/leads/:id | ✅ Required | ✅ Required | ✅ Ownership | 401, 403, 404 |
| GET /api/leads/:id/timeline | ✅ Required | ❌ From lead | ✅ Ownership | 401, 403, 404 |
| GET /api/leads/:id/events | ✅ Required | ❌ From lead | ✅ Ownership | 401, 403, 404 |
| POST /api/leads/:id/status | ✅ Required | ❌ From lead | ✅ Ownership | 400, 401, 403, 404 |
| POST /api/leads/:id/notes | ✅ Required | ❌ From lead | ✅ Ownership | 400, 401, 403, 404 |
| POST /api/leads/:id/tags | ✅ Required | ❌ From lead | ✅ Ownership | 400, 401, 403, 404 |
| DELETE /api/leads/:id/tags/:tag | ✅ Required | ❌ From lead | ✅ Ownership | 401, 403, 404 |
| PUT /api/leads/:id | ✅ Required | ❌ From lead | ✅ Ownership | 400, 401, 403, 404 |
| GET /api/summary | ✅ Required | ✅ Required | ✅ Ownership | 400, 401, 403 |
| GET /api/appointments | ✅ Required | ✅ Required | ✅ Ownership | 400, 401, 403 |
| POST /api/appointments | ✅ Required | ✅ From auth | ✅ Auto | 400, 401, 403 |
| PATCH /api/appointments/:id | ✅ Required | ❌ From appt | ✅ Ownership | 400, 401, 403, 404 |
| GET /api/appointments/:id/conflicts | ✅ Required | ❌ From appt | ✅ Ownership | 401, 403, 404 |
| POST /api/conflicts/:id/resolve | ✅ Required | ❌ From conflict | ✅ Ownership | 401, 403, 404 |
| GET /api/business/:businessId/team | ✅ Required | ✅ Required | ✅ Ownership | 400, 401, 403 |
| POST /api/business/:businessId/invite | ✅ Required | ✅ Required | ✅ Ownership + Role | 400, 401, 403 |
| POST /api/twilio/sms/outbound | ✅ Required | ❌ From lead | ✅ Ownership | 400, 401, 403, 404 |
| GET /api/leads/:leadId/sms | ✅ Required | ❌ From lead | ✅ Ownership | 401, 403, 404 |

---

## Error Code Standards

### HTTP Status Codes

- **400 Bad Request** - Missing business_id or required field
- **401 Unauthorized** - No auth token or invalid token
- **403 Forbidden** - Cross-tenant access attempt or insufficient permissions
- **404 Not Found** - Business/resource not found or inactive
- **500 Internal Server Error** - Unexpected server error

### Error Response Format

```json
{
  "ok": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE_CONSTANT",
  "details": "Optional technical details"
}
```

### Error Codes

- `BUSINESS_ID_REQUIRED` - business_id missing from request
- `BUSINESS_NOT_FOUND` - Business doesn't exist or is inactive
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Access denied to resource
- `INSUFFICIENT_PERMISSIONS` - User role lacks required permissions
- `NO_BUSINESS` - User has no business assignment

---

## Security Event Logging

All security-relevant events are logged using the logger system:

### Cross-Tenant Access Attempts

```javascript
logger.warn('Attempted cross-tenant lead access', {
  userId: req.authContext.userId,
  requestedLeadId: id,
  leadBusinessId: lead.business_id,
  userBusinessId: verifiedBusinessId
});
```

### Team Invitations

```javascript
logger.info(`Team member invited`, {
  businessId: verifiedBusinessId,
  email,
  role,
  userId,
  invitedBy: req.authContext.userId
});
```

### Data Leak Prevention

```javascript
logger.error('Cross-tenant data leak prevented', {
  expectedBusinessId: businessId,
  actualBusinessId: lead.business_id,
  leadId: lead.id
});
```

---

## Database Schema Security

### business_users Table

**Purpose:** Junction table linking users to businesses with roles

```sql
CREATE TABLE business_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);
```

**Security Rules:**
- One user can belong to multiple businesses
- Each user-business pair has a role (owner/manager/staff)
- Only one business can be marked as default per user
- Cascading deletes ensure data integrity

### Query Patterns

All data queries include business_id filter:

```sql
-- Leads
SELECT * FROM leads 
WHERE business_id = $1
ORDER BY created_at DESC;

-- Appointments
SELECT * FROM appointments 
WHERE business_id = $1 
  AND scheduled_date >= $2;

-- Stats
SELECT status, COUNT(*) as count
FROM leads
WHERE business_id = $1
  AND created_at >= $2
GROUP BY status;
```

---

## Testing Coverage

### Security Tests Implemented

See `SECURITY_TESTING_GUIDE.md` for full test suite. Summary:

- **Test 1:** Missing business_id protection (3 tests)
- **Test 2:** Cross-tenant access attempts (5 tests)
- **Test 3:** Invalid/fake business_id protection (2 tests)
- **Test 4:** Lead-specific security (4 tests)
- **Test 5:** Appointment security (2 tests)
- **Test 6:** SMS security (2 tests)
- **Test 7:** Team management security (1 test)
- **Test 8:** Public chat security (2 tests)
- **Test 9:** Data isolation verification (3 SQL tests)
- **Test 10:** Unauthenticated access (3 tests)

**Total Tests:** 27 security test cases

---

## Deployment Checklist

Before deploying to production:

- [ ] Run full security test suite (SECURITY_TESTING_GUIDE.md)
- [ ] Verify all tests return correct error codes (400/401/403/404)
- [ ] Check database queries include business_id filters
- [ ] Confirm middleware order (requireAuth before requireBusinessOwnership)
- [ ] Review security event logs for patterns
- [ ] Test with multiple businesses in staging
- [ ] Verify team invitation permissions
- [ ] Test public chat with inactive business
- [ ] Confirm cross-tenant access fails properly
- [ ] Document any exceptions or special cases

---

## Performance Considerations

### Database Indexes

Ensure these indexes exist for performance:

```sql
-- Leads by business
CREATE INDEX idx_leads_business_id ON leads(business_id);
CREATE INDEX idx_leads_business_created ON leads(business_id, created_at DESC);

-- Appointments by business
CREATE INDEX idx_appointments_business_id ON appointments(business_id);
CREATE INDEX idx_appointments_business_date ON appointments(business_id, scheduled_date);

-- Business users lookup
CREATE INDEX idx_business_users_user_id ON business_users(user_id);
CREATE INDEX idx_business_users_business_id ON business_users(business_id);
CREATE INDEX idx_business_users_user_business ON business_users(user_id, business_id);
```

### Query Optimization

- All queries filtered by business_id early in WHERE clause
- Ownership verification cached in req.authContext
- Single business_users query per request (in middleware)

---

## Known Limitations

### Demo Mode

Demo mode (`isDemo = true`) bypasses ownership checks for testing purposes. In production:

```javascript
// Disable demo mode in production
const DEMO_BUSINESS_ID = '00000000-0000-0000-0000-000000000001';

// Only allow demo for specific endpoints
if (queryBusinessId === DEMO_BUSINESS_ID && process.env.NODE_ENV !== 'production') {
  context.isDemo = true;
  context.businessId = DEMO_BUSINESS_ID;
}
```

### Public Endpoints

`/api/message` is intentionally public for customer chat. Security:
- ✅ Requires business_id
- ✅ Verifies business exists and is active
- ✅ Creates leads scoped to business_id
- ❌ Does NOT require authentication (by design)

---

## Future Enhancements

### Short-term

1. **Rate Limiting** - Add rate limits per business_id to prevent abuse
2. **IP Allowlisting** - Allow businesses to restrict API access by IP
3. **Audit Trail** - Enhanced logging of all data access with timestamps
4. **API Keys** - Alternative auth method for integrations

### Medium-term

1. **Field-Level Permissions** - Different roles see different fields
2. **Data Retention Policies** - Auto-delete old data per business settings
3. **GDPR Compliance** - Data export and deletion endpoints
4. **Multi-Factor Auth** - Require MFA for owner role

### Long-term

1. **Row-Level Security (RLS)** - Move ownership checks to database level
2. **Read Replicas** - Separate read/write databases per business
3. **Tenant Isolation** - Separate database schemas per business
4. **Encryption at Rest** - Encrypt sensitive fields per business

---

## Migration Notes

### Upgrading from Previous Version

If upgrading from version without security:

1. **Add missing indexes** (see Performance Considerations)
2. **Update frontend API calls** to include businessId
3. **Test with existing data** to ensure no breakage
4. **Run security test suite** before deploying
5. **Monitor logs** for failed auth attempts after deploy

### Breaking Changes

- **API:** All protected endpoints now require business_id
- **Frontend:** Must pass businessId in all API requests
- **Auth:** JWT token must be valid Supabase access token
- **Team:** Staff members cannot invite team members (owner/manager only)

---

## Support & Documentation

### Related Documents

- `SECURITY_TESTING_GUIDE.md` - Complete testing procedures
- `STEP6_MULTI_BUSINESS_SUMMARY.md` - Multi-business implementation
- `API_DOCUMENTATION.md` - (To be created) Full API reference

### Contact

For security concerns or questions:
- **Security Team:** security@desk.ai
- **GitHub Issues:** https://github.com/desk-ai/backend/issues
- **Slack:** #security channel

---

**Document Version:** 1.0  
**Last Updated:** November 22, 2025  
**Maintained By:** Desk.ai Engineering Team
