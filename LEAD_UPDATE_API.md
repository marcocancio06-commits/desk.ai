# Lead Update API Documentation

## Overview

Business owners can now update lead fields from the dashboard using the new PATCH endpoint.

## Endpoint

```
PATCH /api/leads/:id
```

## Request Parameters

### URL Parameters
- `id` (required): The unique lead ID

### Request Body (JSON)
- `businessId` (required): The business ID for authorization
- `status` (optional): Lead status - one of:
  - `"new"`
  - `"collecting_info"`
  - `"qualified"`
  - `"quoted"`
  - `"scheduled"`
  - `"closed_won"`
  - `"closed_lost"`
- `urgency` (optional): Lead urgency - one of:
  - `"low"`
  - `"normal"`
  - `"high"`
  - `"emergency"`
- `scheduledTime` (optional): ISO 8601 datetime string or `null` to clear
- `ownerNotes` (optional): Free-form text notes from business owner

## Response

### Success (200 OK)
```json
{
  "lead": {
    "id": "lead-1763379430859-9srpj7hc8",
    "businessId": "demo-plumbing",
    "status": "scheduled",
    "urgency": "high",
    "scheduledTime": "2025-11-18T14:00:00Z",
    "ownerNotes": "Customer prefers morning appointment",
    "updatedAt": "2025-11-17T11:37:37.171Z",
    ...
  },
  "message": "Lead updated successfully"
}
```

### Errors

#### 400 Bad Request
Missing required `businessId`:
```json
{
  "error": "businessId is required in request body"
}
```

#### 404 Not Found
Lead not found or doesn't belong to this business:
```json
{
  "error": "Lead not found or does not belong to this business"
}
```

#### 500 Internal Server Error
Server error:
```json
{
  "error": "Failed to update lead"
}
```

## Usage Examples

### Example 1: Schedule a Lead

Mark a lead as scheduled and set the appointment time:

```bash
curl -X PATCH http://localhost:3001/api/leads/lead-1763379430859-9srpj7hc8 \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "status": "scheduled",
    "scheduledTime": "2025-11-18T14:00:00Z"
  }'
```

**Response:**
```json
{
  "lead": {
    "id": "lead-1763379430859-9srpj7hc8",
    "status": "scheduled",
    "scheduledTime": "2025-11-18T14:00:00Z",
    "updatedAt": "2025-11-17T11:37:37.171Z",
    ...
  },
  "message": "Lead updated successfully"
}
```

---

### Example 2: Mark as Closed Won with Notes

Complete a job and add final notes:

```bash
curl -X PATCH http://localhost:3001/api/leads/lead-1763379430859-9srpj7hc8 \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "status": "closed_won",
    "ownerNotes": "Job completed. Installed new pressure regulator valve. Customer very satisfied. Paid $350 cash."
  }'
```

**Response:**
```json
{
  "lead": {
    "id": "lead-1763379430859-9srpj7hc8",
    "status": "closed_won",
    "ownerNotes": "Job completed. Installed new pressure regulator valve. Customer very satisfied. Paid $350 cash.",
    "updatedAt": "2025-11-17T11:37:46.603Z",
    ...
  },
  "message": "Lead updated successfully"
}
```

---

### Example 3: Escalate to Emergency

Update urgency and add priority notes:

```bash
curl -X PATCH http://localhost:3001/api/leads/lead-1763379428401-d189cq0ap \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "urgency": "emergency",
    "ownerNotes": "Customer called - pipe burst getting worse. Moved to top priority."
  }'
```

**Response:**
```json
{
  "lead": {
    "id": "lead-1763379428401-d189cq0ap",
    "urgency": "emergency",
    "ownerNotes": "Customer called - pipe burst getting worse. Moved to top priority.",
    "updatedAt": "2025-11-17T11:37:51.234Z",
    ...
  },
  "message": "Lead updated successfully"
}
```

---

### Example 4: Update Multiple Fields

Update status, urgency, and add notes in one request:

```bash
curl -X PATCH http://localhost:3001/api/leads/lead-xyz123 \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "status": "quoted",
    "urgency": "high",
    "ownerNotes": "Sent quote via email. Customer needs to confirm by tomorrow."
  }'
```

---

### Example 5: Clear Scheduled Time

Set scheduledTime to null to remove it:

```bash
curl -X PATCH http://localhost:3001/api/leads/lead-xyz123 \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "scheduledTime": null,
    "ownerNotes": "Customer needs to reschedule - will call back."
  }'
```

---

## Field Validation

### Status Validation
Only these values are accepted:
- `new` - New lead, no interaction yet
- `collecting_info` - AI is gathering customer information
- `qualified` - Ready to book, all info collected
- `quoted` - Quote sent to customer
- `scheduled` - Appointment scheduled
- `closed_won` - Job completed successfully
- `closed_lost` - Lead lost (customer declined, etc.)

**Invalid status values are silently ignored** (existing status preserved).

### Urgency Validation
Only these values are accepted:
- `low` - Can wait, no rush
- `normal` - Standard priority
- `high` - Important, needs attention soon
- `emergency` - Critical, immediate response needed

**Invalid urgency values are silently ignored** (existing urgency preserved).

### ScheduledTime Format
Must be a valid ISO 8601 datetime string:
- ✅ `"2025-11-18T14:00:00Z"`
- ✅ `"2025-11-18T14:00:00.000Z"`
- ✅ `"2025-11-18T09:30:00-05:00"`
- ✅ `null` (to clear the value)

### OwnerNotes
- Any string value is accepted
- Can be empty string `""`
- Can be `null` to clear notes
- No maximum length enforced (keep it reasonable)

---

## Implementation Details

### Backend Changes

#### leadStore.js
Added new function `updateLeadFields()`:
- Validates lead exists and belongs to businessId
- Only updates provided fields
- Validates status and urgency values
- Updates `updatedAt` timestamp automatically
- Returns updated lead or null if not found

Added new fields to lead schema:
- `scheduledTime`: ISO string or null (separate from preferredTime)
- `ownerNotes`: string or null (business owner's notes)

#### index.js
New route `PATCH /api/leads/:id`:
- Validates businessId is provided
- Calls updateLeadFields() with request data
- Returns 404 if lead not found
- Returns 400 for validation errors
- Returns 500 for server errors

---

## Security Notes

### TODO: Authentication Required
Current implementation requires `businessId` in request body but **does not verify** the requester owns that business.

**Before production:**
- Add JWT or session-based authentication
- Verify business owner permissions in middleware
- Don't trust `businessId` from request body
- Use authenticated user's business ID instead

### TODO: Database Migration
Current implementation uses in-memory storage. Data is lost on server restart.

**Before production:**
- Move to PostgreSQL, MongoDB, or similar
- Add proper indexes on `id` and `businessId`
- Implement connection pooling
- Add transaction support

---

## Testing

Run the test suite:

```bash
# Get a lead ID
LEAD_ID=$(curl -s "http://localhost:3001/api/leads?businessId=demo-plumbing" | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['leads'][0]['id'])")

# Test 1: Update status
curl -X PATCH http://localhost:3001/api/leads/$LEAD_ID \
  -H "Content-Type: application/json" \
  -d '{"businessId": "demo-plumbing", "status": "scheduled"}'

# Test 2: Add notes
curl -X PATCH http://localhost:3001/api/leads/$LEAD_ID \
  -H "Content-Type: application/json" \
  -d '{"businessId": "demo-plumbing", "ownerNotes": "Test notes"}'

# Test 3: Update urgency
curl -X PATCH http://localhost:3001/api/leads/$LEAD_ID \
  -H "Content-Type: application/json" \
  -d '{"businessId": "demo-plumbing", "urgency": "emergency"}'

# Test 4: 404 error
curl -X PATCH http://localhost:3001/api/leads/fake-id \
  -H "Content-Type: application/json" \
  -d '{"businessId": "demo-plumbing", "status": "scheduled"}'

# Test 5: 400 error
curl -X PATCH http://localhost:3001/api/leads/$LEAD_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "scheduled"}'
```

---

## Next Steps

### Frontend Integration
To integrate with the dashboard:

```javascript
// Example React/Next.js function
async function updateLead(leadId, updates) {
  const response = await fetch(`${BACKEND_URL}/api/leads/${leadId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      businessId: 'demo-plumbing', // TODO: Get from auth context
      ...updates
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  const data = await response.json();
  return data.lead;
}

// Usage examples:
await updateLead('lead-123', { status: 'scheduled' });
await updateLead('lead-123', { urgency: 'emergency', ownerNotes: 'Urgent!' });
await updateLead('lead-123', { 
  status: 'scheduled',
  scheduledTime: '2025-11-18T14:00:00Z',
  ownerNotes: 'Confirmed appointment'
});
```

### Recommended Dashboard UI Components
1. **Status Dropdown**: Change lead status from dashboard
2. **Urgency Badges**: Click to change urgency level
3. **Notes Modal**: Add/edit owner notes
4. **Scheduler**: Calendar picker for scheduledTime
5. **Quick Actions**: One-click "Mark as Won/Lost"

---

## Changelog

### 2025-11-17
- ✅ Added `updateLeadFields()` to leadStore.js
- ✅ Added new lead fields: `ownerNotes`, `scheduledTime`
- ✅ Implemented `PATCH /api/leads/:id` endpoint
- ✅ Added validation for status and urgency
- ✅ Added error handling (400, 404, 500)
- ✅ Tested with curl examples
- ✅ Created documentation

---

## Support

For questions or issues:
1. Check this documentation
2. Review DEV_GUIDE.md for setup info
3. Check QUICK_REFERENCE.md for common commands
4. Review code comments in leadStore.js and index.js
