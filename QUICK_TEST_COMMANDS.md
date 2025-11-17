# Quick Test Commands - Lead Update API

## Quick Copy-Paste Commands

### Get a Lead ID for Testing
```bash
LEAD_ID=$(curl -s "http://localhost:3001/api/leads?businessId=demo-plumbing" | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['leads'][0]['id'])")
echo "Testing with: $LEAD_ID"
```

### 1. Schedule a Lead
```bash
curl -X PATCH http://localhost:3001/api/leads/$LEAD_ID \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "status": "scheduled",
    "scheduledTime": "2025-11-18T14:00:00Z"
  }' | python3 -m json.tool
```

### 2. Mark as Closed Won
```bash
curl -X PATCH http://localhost:3001/api/leads/$LEAD_ID \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "status": "closed_won",
    "ownerNotes": "Job completed. Customer paid $350."
  }' | python3 -m json.tool
```

### 3. Escalate to Emergency
```bash
curl -X PATCH http://localhost:3001/api/leads/$LEAD_ID \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "urgency": "emergency",
    "ownerNotes": "Urgent - customer called again."
  }' | python3 -m json.tool
```

### 4. Update Multiple Fields
```bash
curl -X PATCH http://localhost:3001/api/leads/$LEAD_ID \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "status": "qualified",
    "urgency": "high",
    "ownerNotes": "Ready to schedule - high priority customer"
  }' | python3 -m json.tool
```

### 5. Just Add Notes
```bash
curl -X PATCH http://localhost:3001/api/leads/$LEAD_ID \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "ownerNotes": "Called customer - will reschedule for next week."
  }' | python3 -m json.tool
```

## Valid Field Values

### Status
- `"new"` - New lead, no interaction yet
- `"collecting_info"` - AI is gathering information
- `"qualified"` - Ready to book
- `"quoted"` - Quote sent
- `"scheduled"` - Appointment scheduled
- `"closed_won"` - Job completed successfully
- `"closed_lost"` - Lead lost

### Urgency
- `"low"` - Can wait
- `"normal"` - Standard priority
- `"high"` - Needs attention soon
- `"emergency"` - Immediate response needed

### ScheduledTime
- ISO 8601 format: `"2025-11-18T14:00:00Z"`
- Or `null` to clear

### OwnerNotes
- Any string
- Empty string `""` to clear
- Or `null`

## View All Leads
```bash
curl "http://localhost:3001/api/leads?businessId=demo-plumbing" | python3 -m json.tool
```

## View Specific Lead Details
```bash
curl "http://localhost:3001/api/leads?businessId=demo-plumbing" | \
  python3 -c "import sys, json; data = json.load(sys.stdin); lead = data['leads'][0]; print(f'''
Lead ID: {lead['id']}
Phone: {lead['phone']}
Status: {lead['status']}
Urgency: {lead.get('urgency', 'N/A')}
Scheduled: {lead.get('scheduledTime', 'None')}
Notes: {lead.get('ownerNotes', 'None')}
Updated: {lead['updatedAt']}
''')"
```

## Test Error Cases

### 404 - Non-existent lead
```bash
curl -X PATCH http://localhost:3001/api/leads/fake-lead-id \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "status": "scheduled"
  }'
```

### 400 - Missing businessId
```bash
curl -X PATCH http://localhost:3001/api/leads/$LEAD_ID \
  -H "Content-Type: application/json" \
  -d '{
    "status": "scheduled"
  }'
```

## Run Full Test Suite
```bash
bash /tmp/test-lead-update.sh
```
