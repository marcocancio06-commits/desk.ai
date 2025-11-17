# FrontDesk AI MVP - Testing Guide

## Overview
This guide shows how to test the complete end-to-end flow of the FrontDesk AI MVP, from customer chat to lead creation to dashboard display.

## Prerequisites
- Backend running on port 3001
- Frontend running on port 3000
- ANTHROPIC_API_KEY set in `frontdesk-backend/.env`

## Start Servers

### Backend
```bash
cd frontdesk-backend
node index.js
```

### Frontend
```bash
cd frontend
npm run dev
```

## Test Flow

### 1. Test Backend Directly

**Health Check:**
```bash
curl http://localhost:3001/health
```

**Send a message (creates a lead):**
```bash
curl -X POST http://localhost:3001/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "from": "555-TEST-001",
    "channel": "web",
    "message": "I need emergency plumbing in 77005 - pipe burst!"
  }'
```

**View all leads:**
```bash
curl "http://localhost:3001/api/leads?businessId=demo-plumbing"
```

### 2. Test Customer Chat UI

1. Open browser to: `http://localhost:3000/demo-chat`
2. Enter a message like: "I need drain cleaning in 77030 next week"
3. Watch the AI respond and see the structured data in the debug panel
4. Continue the conversation to see how the lead is updated
5. Note the phone number and message details

### 3. Test Business Owner Dashboard

**View Dashboard:**
1. Open browser to: `http://localhost:3000/dashboard`
2. See real-time stats (total leads, collecting_info, qualified, scheduled)
3. View recent activity showing your test leads

**View All Leads:**
1. Navigate to: `http://localhost:3000/dashboard/leads`
2. See all leads in a filterable table
3. Filter by status (new, collecting_info, qualified, etc.)
4. Search by phone number or zip code

## Test Scenarios

### Scenario 1: Emergency Booking
```bash
# Message 1
curl -X POST http://localhost:3001/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "from": "555-0001",
    "channel": "web",
    "message": "URGENT! Water heater burst in 77005!"
  }'

# Message 2 (continues conversation)
curl -X POST http://localhost:3001/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "from": "555-0001",
    "channel": "web",
    "message": "Need someone ASAP, flooding my basement"
  }'

# Check the lead
curl "http://localhost:3001/api/leads?businessId=demo-plumbing" | python3 -m json.tool
```

### Scenario 2: Regular Service Request
```bash
curl -X POST http://localhost:3001/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "from": "555-0002",
    "channel": "web",
    "message": "Looking for drain cleaning in 77030, maybe next Tuesday?"
  }'
```

### Scenario 3: Quote Request
```bash
curl -X POST http://localhost:3001/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "from": "555-0003",
    "channel": "web",
    "message": "How much does water heater installation cost in 77098?"
  }'
```

## What to Verify

### Lead Creation
- ✅ Each message creates or updates a lead
- ✅ Leads have unique IDs
- ✅ Phone numbers are tracked correctly
- ✅ Messages are stored in conversation history
- ✅ AI extracts: zip_code, issue_summary, urgency, preferred_time

### Lead Status Progression
- ✅ `new` → Initial contact
- ✅ `collecting_info` → AI gathering details
- ✅ `qualified` → Ready to book (booking_intent === 'ready_to_book')
- ✅ `scheduled` → Appointment booked (booking_intent === 'confirmed')

### Dashboard Integration
- ✅ Stats reflect real lead counts
- ✅ Lead table shows actual conversations
- ✅ Filters work (status, zip code, urgency)
- ✅ Latest leads appear at the top
- ✅ Message count shows total exchanges

### Data Persistence
- ✅ Leads persist between requests (in-memory)
- ✅ Conversation threads are maintained
- ✅ Collected data is updated as AI gathers more info
- ✅ Urgency level is tracked (normal, urgent, emergency)

## API Endpoints Reference

### POST /api/message
Creates or updates a lead from a customer message.

**Request:**
```json
{
  "businessId": "demo-plumbing",
  "from": "555-123-4567",
  "channel": "web|sms|phone",
  "message": "Customer message text"
}
```

**Response:**
```json
{
  "reply": "AI response text",
  "booking_intent": "new|collecting_info|ready_to_book|confirmed|not_interested",
  "collected_data": {
    "issue_summary": "clogged drain",
    "zip_code": "77005",
    "preferred_time": "next Tuesday",
    "urgency": "normal|urgent|emergency"
  },
  "internal_notes": "Context for business owner",
  "lead": {
    "id": "lead-1234567890-abc123",
    "status": "collecting_info",
    "updatedAt": "2025-11-17T09:10:00.000Z"
  }
}
```

### GET /api/leads?businessId={id}
Fetches all leads for a business.

**Response:**
```json
{
  "leads": [
    {
      "id": "lead-1234567890-abc123",
      "businessId": "demo-plumbing",
      "source": "web",
      "customerName": null,
      "phone": "555-123-4567",
      "lastMessage": "Last customer message",
      "issueSummary": "pipe burst",
      "zipCode": "77005",
      "preferredTime": null,
      "urgency": "emergency",
      "status": "collecting_info",
      "createdAt": "2025-11-17T09:10:00.000Z",
      "updatedAt": "2025-11-17T09:10:15.000Z",
      "messages": [
        {
          "from": "customer|assistant",
          "text": "Message text",
          "timestamp": "2025-11-17T09:10:00.000Z"
        }
      ]
    }
  ],
  "stats": {
    "total": 10,
    "new": 0,
    "collecting_info": 7,
    "qualified": 2,
    "scheduled": 1,
    "closed_won": 0,
    "closed_lost": 0
  },
  "count": 10
}
```

## Notes

### In-Memory Storage
- Leads are stored in memory (restart clears data)
- Next phase: Add PostgreSQL/MongoDB for persistence
- Current implementation perfect for demo and testing

### AI Model
- Using Claude 3 Haiku (fast, cost-effective)
- Fallback response if API key missing
- Can upgrade to Claude 3 Sonnet/Opus for better accuracy

### Future Enhancements
- [ ] Add lead assignment to team members
- [ ] Email notifications for new leads
- [ ] SMS integration for customer replies
- [ ] Calendar booking integration
- [ ] Payment processing
- [ ] Lead scoring and routing
