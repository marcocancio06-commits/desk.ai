# Multi-Tenant Security Testing Guide

**Status:** Complete multi-tenant isolation implementation
**Date:** November 22, 2025
**Version:** 1.0

---

## Overview

This guide provides comprehensive security testing procedures to verify multi-tenant data isolation in Desk.ai. All tests should **FAIL** with proper 400/403/404 responses, ensuring users cannot access data from other businesses.

### Security Principles Implemented

1. **business_id Required** - All API endpoints require valid business_id
2. **Ownership Verification** - Users can only access businesses they own/manage
3. **Data Isolation** - All database queries filter by business_id
4. **Public Endpoint Protection** - Public chat validates business exists and is active
5. **No Data Leakage** - Cross-tenant access attempts return 403 Forbidden

---

## Prerequisites

### Test Environment Setup

```bash
# Backend running on port 3001
cd frontdesk-backend
npm run dev

# Frontend running on port 3000
cd frontend
npm run dev
```

### Test Data Setup

Run these SQL queries in Supabase SQL Editor to create test data:

```sql
-- Create two test businesses
INSERT INTO businesses (id, slug, name, phone, industry, service_zip_codes, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'test-plumbing-co', 'Test Plumbing Co', '+1-555-100-0001', 'plumbing', ARRAY['10001', '10002'], true),
  ('22222222-2222-2222-2222-222222222222', 'test-hvac-pros', 'Test HVAC Pros', '+1-555-200-0002', 'hvac', ARRAY['20001', '20002'], true);

-- Create two test users
-- Note: Replace with actual user IDs from Supabase Auth
INSERT INTO profiles (id, full_name, email)
VALUES 
  ('user-1111-1111-1111-1111', 'Owner One', 'owner1@test.com'),
  ('user-2222-2222-2222-2222', 'Owner Two', 'owner2@test.com');

-- Link users to businesses
INSERT INTO business_users (user_id, business_id, role, is_default)
VALUES 
  ('user-1111-1111-1111-1111', '11111111-1111-1111-1111-111111111111', 'owner', true),
  ('user-2222-2222-2222-2222', '22222222-2222-2222-2222-222222222222', 'owner', true);

-- Create test leads for each business
INSERT INTO leads (id, business_id, phone, name, status, issue_summary, zip_code)
VALUES 
  ('lead-1111-1111-1111-1111', '11111111-1111-1111-1111-111111111111', '+1-555-999-0001', 'Customer A', 'new', 'Leaky faucet', '10001'),
  ('lead-2222-2222-2222-2222', '22222222-2222-2222-2222-222222222222', '+1-555-999-0002', 'Customer B', 'new', 'AC not cooling', '20001');

-- Create test appointments for each business
INSERT INTO appointments (id, business_id, lead_id, scheduled_date, scheduled_time, issue_summary, status)
VALUES 
  ('apt-1111-1111-1111-1111', '11111111-1111-1111-1111-111111111111', 'lead-1111-1111-1111-1111', '2025-12-01', '10:00', 'Fix faucet', 'pending'),
  ('apt-2222-2222-2222-2222', '22222222-2222-2222-2222-222222222222', 'lead-2222-2222-2222-2222', '2025-12-01', '14:00', 'Repair AC', 'pending');
```

---

## Test 1: Missing business_id Protection

**Objective:** Verify all endpoints reject requests without business_id

### Test 1.1: Chat Message Without business_id

```bash
curl -X POST http://localhost:3001/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+1-555-123-4567",
    "message": "I need help with my AC"
  }'
```

**Expected Result:**
```json
{
  "error": "business_id required",
  "code": "BUSINESS_ID_REQUIRED"
}
```
**HTTP Status:** 400 Bad Request

### Test 1.2: Get Leads Without business_id

```bash
# Get owner1's access token from Supabase
ACCESS_TOKEN="<owner1_supabase_token>"

curl -X GET "http://localhost:3001/api/leads" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Result:**
```json
{
  "ok": false,
  "error": "business_id required",
  "code": "BUSINESS_ID_REQUIRED"
}
```
**HTTP Status:** 400 Bad Request

### Test 1.3: Get Appointments Without business_id

```bash
curl -X GET "http://localhost:3001/api/appointments" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Result:**
```json
{
  "ok": false,
  "error": "business_id required",
  "code": "BUSINESS_ID_REQUIRED"
}
```
**HTTP Status:** 400 Bad Request

---

## Test 2: Cross-Tenant Access Attempts

**Objective:** Verify users cannot access data from businesses they don't own

### Test 2.1: Owner1 Tries to Access Owner2's Leads

```bash
# Get owner1's token
OWNER1_TOKEN="<owner1_supabase_token>"

# Try to access owner2's business leads
curl -X GET "http://localhost:3001/api/leads?businessId=22222222-2222-2222-2222-222222222222" \
  -H "Authorization: Bearer $OWNER1_TOKEN"
```

**Expected Result:**
```json
{
  "ok": false,
  "error": "Access denied - you do not have permission to access this business",
  "code": "FORBIDDEN"
}
```
**HTTP Status:** 403 Forbidden

### Test 2.2: Owner1 Tries to Access Owner2's Lead by ID

```bash
curl -X PATCH "http://localhost:3001/api/leads/lead-2222-2222-2222-2222" \
  -H "Authorization: Bearer $OWNER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "22222222-2222-2222-2222-222222222222",
    "status": "contacted"
  }'
```

**Expected Result:**
```json
{
  "ok": false,
  "error": "Access denied - you do not have permission to access this business",
  "code": "FORBIDDEN"
}
```
**HTTP Status:** 403 Forbidden

### Test 2.3: Owner1 Tries to Access Owner2's Appointments

```bash
curl -X GET "http://localhost:3001/api/appointments?businessId=22222222-2222-2222-2222-222222222222" \
  -H "Authorization: Bearer $OWNER1_TOKEN"
```

**Expected Result:**
```json
{
  "ok": false,
  "error": "Access denied - you do not have permission to access this business",
  "code": "FORBIDDEN"
}
```
**HTTP Status:** 403 Forbidden

### Test 2.4: Owner1 Tries to Update Owner2's Appointment

```bash
curl -X PATCH "http://localhost:3001/api/appointments/apt-2222-2222-2222-2222" \
  -H "Authorization: Bearer $OWNER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "cancelled"
  }'
```

**Expected Result:**
```json
{
  "ok": false,
  "error": "Access denied",
  "code": "FORBIDDEN"
}
```
**HTTP Status:** 403 Forbidden

### Test 2.5: Owner1 Tries to Access Owner2's Team

```bash
curl -X GET "http://localhost:3001/api/business/22222222-2222-2222-2222-222222222222/team" \
  -H "Authorization: Bearer $OWNER1_TOKEN"
```

**Expected Result:**
```json
{
  "ok": false,
  "error": "Access denied - you do not have permission to access this business",
  "code": "FORBIDDEN"
}
```
**HTTP Status:** 403 Forbidden

---

## Test 3: Invalid/Fake business_id Protection

**Objective:** Verify system rejects non-existent or inactive businesses

### Test 3.1: Chat Message with Fake business_id

```bash
curl -X POST http://localhost:3001/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "99999999-9999-9999-9999-999999999999",
    "from": "+1-555-123-4567",
    "message": "I need help"
  }'
```

**Expected Result:**
```json
{
  "error": "Business not found or inactive",
  "code": "BUSINESS_NOT_FOUND"
}
```
**HTTP Status:** 404 Not Found

### Test 3.2: Get Leads with Fake business_id

```bash
curl -X GET "http://localhost:3001/api/leads?businessId=99999999-9999-9999-9999-999999999999" \
  -H "Authorization: Bearer $OWNER1_TOKEN"
```

**Expected Result:**
```json
{
  "ok": false,
  "error": "Access denied - you do not have permission to access this business",
  "code": "FORBIDDEN"
}
```
**HTTP Status:** 403 Forbidden

---

## Test 4: Lead-Specific Security

**Objective:** Verify lead operations are business-scoped

### Test 4.1: Update Lead - Wrong Business Owner

```bash
# Owner2 tries to update Owner1's lead
OWNER2_TOKEN="<owner2_supabase_token>"

curl -X PATCH "http://localhost:3001/api/leads/lead-1111-1111-1111-1111" \
  -H "Authorization: Bearer $OWNER2_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "11111111-1111-1111-1111-111111111111",
    "status": "contacted"
  }'
```

**Expected Result:**
```json
{
  "error": "Access denied - lead belongs to different business",
  "code": "FORBIDDEN"
}
```
**HTTP Status:** 403 Forbidden

### Test 4.2: Get Lead Timeline - Wrong Business

```bash
curl -X GET "http://localhost:3001/api/leads/lead-1111-1111-1111-1111/timeline" \
  -H "Authorization: Bearer $OWNER2_TOKEN"
```

**Expected Result:**
```json
{
  "error": "Access denied",
  "code": "FORBIDDEN"
}
```
**HTTP Status:** 403 Forbidden

### Test 4.3: Add Note to Wrong Business's Lead

```bash
curl -X POST "http://localhost:3001/api/leads/lead-1111-1111-1111-1111/notes" \
  -H "Authorization: Bearer $OWNER2_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "This should fail"
  }'
```

**Expected Result:**
```json
{
  "error": "Access denied",
  "code": "FORBIDDEN"
}
```
**HTTP Status:** 403 Forbidden

### Test 4.4: Add Tag to Wrong Business's Lead

```bash
curl -X POST "http://localhost:3001/api/leads/lead-1111-1111-1111-1111/tags" \
  -H "Authorization: Bearer $OWNER2_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tag": "urgent"
  }'
```

**Expected Result:**
```json
{
  "error": "Access denied",
  "code": "FORBIDDEN"
}
```
**HTTP Status:** 403 Forbidden

---

## Test 5: Appointment Security

**Objective:** Verify appointment operations are business-scoped

### Test 5.1: Get Conflicts - Wrong Business

```bash
curl -X GET "http://localhost:3001/api/appointments/apt-1111-1111-1111-1111/conflicts" \
  -H "Authorization: Bearer $OWNER2_TOKEN"
```

**Expected Result:**
```json
{
  "ok": false,
  "error": "Access denied",
  "code": "FORBIDDEN"
}
```
**HTTP Status:** 403 Forbidden

### Test 5.2: Resolve Conflict - Wrong Business

```bash
curl -X POST "http://localhost:3001/api/conflicts/<conflict_id>/resolve" \
  -H "Authorization: Bearer $OWNER2_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resolvedBy": "owner2"
  }'
```

**Expected Result:**
```json
{
  "ok": false,
  "error": "Access denied",
  "code": "FORBIDDEN"
}
```
**HTTP Status:** 403 Forbidden

---

## Test 6: SMS Security

**Objective:** Verify SMS operations are business-scoped

### Test 6.1: Send SMS to Wrong Business's Lead

```bash
curl -X POST "http://localhost:3001/api/twilio/sms/outbound" \
  -H "Authorization: Bearer $OWNER2_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "lead-1111-1111-1111-1111",
    "phoneNumber": "+1-555-999-0001",
    "message": "This should fail"
  }'
```

**Expected Result:**
```json
{
  "ok": false,
  "error": "Access denied",
  "code": "FORBIDDEN"
}
```
**HTTP Status:** 403 Forbidden

### Test 6.2: Get SMS Messages - Wrong Business's Lead

```bash
curl -X GET "http://localhost:3001/api/leads/lead-1111-1111-1111-1111/sms" \
  -H "Authorization: Bearer $OWNER2_TOKEN"
```

**Expected Result:**
```json
{
  "ok": false,
  "error": "Access denied",
  "code": "FORBIDDEN"
}
```
**HTTP Status:** 403 Forbidden

---

## Test 7: Team Management Security

**Objective:** Verify team invites require proper permissions

### Test 7.1: Staff Tries to Invite Team Member

```sql
-- First, create a staff member for business 1
INSERT INTO business_users (user_id, business_id, role, is_default)
VALUES ('user-3333-3333-3333-3333', '11111111-1111-1111-1111-111111111111', 'staff', false);
```

```bash
# Get staff member's token
STAFF_TOKEN="<staff_supabase_token>"

curl -X POST "http://localhost:3001/api/business/11111111-1111-1111-1111-111111111111/invite" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newstaff@test.com",
    "role": "staff"
  }'
```

**Expected Result:**
```json
{
  "ok": false,
  "error": "Only owners and managers can invite team members",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```
**HTTP Status:** 403 Forbidden

---

## Test 8: Public Chat Security

**Objective:** Verify public chat validates business and creates leads properly

### Test 8.1: Chat with Valid Business

```bash
curl -X POST http://localhost:3001/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "11111111-1111-1111-1111-111111111111",
    "from": "+1-555-888-9999",
    "channel": "web_chat",
    "message": "I have a plumbing emergency"
  }'
```

**Expected Result:**
```json
{
  "reply": "...",
  "booking_intent": "...",
  "lead": {
    "id": "...",
    "status": "...",
    "conversation_state": "...",
    "updatedAt": "..."
  }
}
```
**HTTP Status:** 200 OK

**Verification SQL:**
```sql
-- Verify lead was created for correct business
SELECT business_id, phone, name 
FROM leads 
WHERE phone = '+1-555-888-9999';

-- Should show business_id = 11111111-1111-1111-1111-111111111111
```

### Test 8.2: Chat with Inactive Business

```sql
-- Deactivate a business
UPDATE businesses 
SET is_active = false 
WHERE id = '11111111-1111-1111-1111-111111111111';
```

```bash
curl -X POST http://localhost:3001/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "11111111-1111-1111-1111-111111111111",
    "from": "+1-555-777-8888",
    "message": "Need service"
  }'
```

**Expected Result:**
```json
{
  "error": "Business not found or inactive",
  "code": "BUSINESS_NOT_FOUND"
}
```
**HTTP Status:** 404 Not Found

```sql
-- Reactivate for further tests
UPDATE businesses 
SET is_active = true 
WHERE id = '11111111-1111-1111-1111-111111111111';
```

---

## Test 9: Data Isolation Verification

**Objective:** Verify database queries properly filter by business_id

### Test 9.1: Verify Leads Isolation

```sql
-- Owner1 should only see their leads
SELECT id, business_id, phone, name 
FROM leads 
WHERE business_id = '11111111-1111-1111-1111-111111111111';
-- Should return only lead-1111-1111-1111-1111

-- Owner2 should only see their leads
SELECT id, business_id, phone, name 
FROM leads 
WHERE business_id = '22222222-2222-2222-2222-222222222222';
-- Should return only lead-2222-2222-2222-2222

-- Verify no cross-contamination
SELECT COUNT(*) as leaked_leads
FROM leads
WHERE business_id = '11111111-1111-1111-1111-111111111111'
  AND id = 'lead-2222-2222-2222-2222';
-- Should return 0
```

### Test 9.2: Verify Appointments Isolation

```sql
-- Owner1's appointments
SELECT id, business_id, issue_summary 
FROM appointments 
WHERE business_id = '11111111-1111-1111-1111-111111111111';
-- Should return only apt-1111-1111-1111-1111

-- Owner2's appointments
SELECT id, business_id, issue_summary 
FROM appointments 
WHERE business_id = '22222222-2222-2222-2222-222222222222';
-- Should return only apt-2222-2222-2222-2222
```

### Test 9.3: Verify Messages Isolation

```sql
-- Check messages are linked to correct business via leads
SELECT m.id, m.text, l.business_id
FROM messages m
JOIN leads l ON l.id = m.lead_id
WHERE l.business_id = '11111111-1111-1111-1111-111111111111';
-- Should only show messages from business 1's leads
```

---

## Test 10: Unauthenticated Access

**Objective:** Verify protected endpoints reject unauthenticated requests

### Test 10.1: Get Leads Without Auth

```bash
curl -X GET "http://localhost:3001/api/leads?businessId=11111111-1111-1111-1111-111111111111"
```

**Expected Result:**
```json
{
  "ok": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```
**HTTP Status:** 401 Unauthorized

### Test 10.2: Update Lead Without Auth

```bash
curl -X PATCH "http://localhost:3001/api/leads/lead-1111-1111-1111-1111" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "11111111-1111-1111-1111-111111111111",
    "status": "contacted"
  }'
```

**Expected Result:**
```json
{
  "ok": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```
**HTTP Status:** 401 Unauthorized

### Test 10.3: Get Appointments Without Auth

```bash
curl -X GET "http://localhost:3001/api/appointments?businessId=11111111-1111-1111-1111-111111111111"
```

**Expected Result:**
```json
{
  "ok": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```
**HTTP Status:** 401 Unauthorized

---

## Security Audit Checklist

Use this checklist to verify all security measures are in place:

### Backend API Security

- [x] **POST /api/message** - Requires business_id, verifies business exists and is active
- [x] **GET /api/leads** - Requires auth + business_id, verifies ownership
- [x] **PATCH /api/leads/:id** - Requires auth, verifies lead belongs to user's business
- [x] **GET /api/leads/:id/timeline** - Requires auth, verifies ownership
- [x] **GET /api/leads/:id/events** - Requires auth, verifies ownership
- [x] **POST /api/leads/:id/status** - Requires auth, verifies ownership
- [x] **POST /api/leads/:id/notes** - Requires auth, verifies ownership
- [x] **POST /api/leads/:id/tags** - Requires auth, verifies ownership
- [x] **DELETE /api/leads/:id/tags/:tag** - Requires auth, verifies ownership
- [x] **PUT /api/leads/:id** - Requires auth, verifies ownership
- [x] **GET /api/summary** - Requires auth + business_id, verifies ownership
- [x] **GET /api/appointments** - Requires auth + business_id, verifies ownership
- [x] **POST /api/appointments** - Requires auth, uses authenticated business_id
- [x] **PATCH /api/appointments/:id** - Requires auth, verifies ownership
- [x] **GET /api/appointments/:id/conflicts** - Requires auth, verifies ownership
- [x] **POST /api/conflicts/:id/resolve** - Requires auth, verifies ownership
- [x] **GET /api/business/:businessId/team** - Requires auth + ownership verification
- [x] **POST /api/business/:businessId/invite** - Requires auth + ownership + role check
- [x] **POST /api/twilio/sms/outbound** - Requires auth, verifies lead ownership
- [x] **GET /api/leads/:leadId/sms** - Requires auth, verifies lead ownership

### Database Query Security

- [x] **getAllLeads()** - Filters by business_id
- [x] **getLeadStats()** - Filters by business_id
- [x] **getAppointmentsByBusiness()** - Filters by business_id
- [x] **getLeadByPhone()** - Includes business_id parameter
- [x] **createLead()** - Requires business_id
- [x] **createAppointment()** - Requires business_id

### Frontend API Calls

- [ ] **dashboard/index.js** - Includes businessId in /api/leads request
- [ ] **dashboard/leads.js** - Includes businessId in /api/leads request
- [ ] **dashboard/calendar.js** - Includes businessId in /api/appointments request
- [ ] **b/[slug].js** - Passes business.id in /api/message request

### Middleware Security

- [x] **requireAuth** - Verifies Supabase token
- [x] **requireBusiness** - Ensures user has a business assigned
- [x] **requireBusinessOwnership** - Verifies user owns the requested business
- [x] **verifyBusinessAccess** - Checks business_users table for membership

---

## Success Criteria

All security tests should result in:

✅ **Proper Error Codes**
- 400 Bad Request - Missing business_id
- 401 Unauthorized - No auth token
- 403 Forbidden - Cross-tenant access attempt
- 404 Not Found - Invalid/inactive business

✅ **No Data Leakage**
- Users cannot see leads from other businesses
- Users cannot see appointments from other businesses
- Users cannot see team members from other businesses
- Users cannot send SMS to leads from other businesses

✅ **Logging Security Events**
- Failed cross-tenant access attempts are logged
- Invalid business_id attempts are logged
- Successful team invites are logged with inviter ID

✅ **Database Integrity**
- All queries filter by business_id
- No cross-contamination in data
- business_users table properly enforces ownership

---

## Troubleshooting

### Test Failing with 200 OK Instead of 403

**Problem:** Security check not working
**Solution:** Check middleware order - requireBusinessOwnership must come after requireAuth

### Test Failing with 500 Instead of 403

**Problem:** Database helper function missing
**Solution:** Verify getLeadById, getAppointmentById, getConflictById exist in db.js

### Cross-Tenant Access Succeeding

**Problem:** User has access to both businesses
**Solution:** Verify business_users table - user should only be linked to one business

---

## Manual Testing Completion Form

**Tester:**  
**Date:**  
**Environment:** [ ] Development [ ] Staging [ ] Production

| Test | Status | Notes |
|------|--------|-------|
| Test 1: Missing business_id | ⬜ Pass ⬜ Fail | |
| Test 2: Cross-tenant access | ⬜ Pass ⬜ Fail | |
| Test 3: Invalid business_id | ⬜ Pass ⬜ Fail | |
| Test 4: Lead security | ⬜ Pass ⬜ Fail | |
| Test 5: Appointment security | ⬜ Pass ⬜ Fail | |
| Test 6: SMS security | ⬜ Pass ⬜ Fail | |
| Test 7: Team management | ⬜ Pass ⬜ Fail | |
| Test 8: Public chat | ⬜ Pass ⬜ Fail | |
| Test 9: Data isolation | ⬜ Pass ⬜ Fail | |
| Test 10: Unauthenticated | ⬜ Pass ⬜ Fail | |

**Overall Status:** ⬜ All Tests Passed ⬜ Issues Found

**Issues Found:**

---

## Next Steps

After completing security testing:

1. **Fix any failing tests** - Update middleware/guards as needed
2. **Run tests again** - Verify fixes work
3. **Document in changelog** - Record security improvements
4. **Update API documentation** - Note required fields and auth
5. **Deploy to staging** - Test in staging environment
6. **Final production deploy** - After all tests pass

---

**Document Version:** 1.0  
**Last Updated:** November 22, 2025  
**Maintained By:** Desk.ai Security Team
