# Summary API - Documentation

## Overview

The `/api/summary` endpoint provides a comprehensive daily summary for business owners, including:
- Metrics for today and the last 7 days
- Calendar-ready appointments list
- AI-generated operational insights

## Endpoint

**GET /api/summary**

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| businessId | string | No | demo-plumbing | The business identifier |

### Response Format

```json
{
  "businessId": "demo-plumbing",
  "dateRange": {
    "today": "YYYY-MM-DD",
    "last7DaysStart": "YYYY-MM-DD"
  },
  "metrics": {
    "today": {
      "totalLeads": number,
      "new": number,
      "collecting_info": number,
      "qualified": number,
      "scheduled": number,
      "urgent": number
    },
    "last7Days": {
      "totalLeads": number,
      "new": number,
      "collecting_info": number,
      "qualified": number,
      "scheduled": number,
      "urgent": number
    }
  },
  "appointments": [
    {
      "id": "apt-lead-xxx",
      "leadId": "lead-xxx",
      "customerName": string | null,
      "phone": string | null,
      "issueSummary": string | null,
      "scheduledTime": string | null,
      "status": "qualified" | "scheduled",
      "urgency": "low" | "normal" | "high" | "emergency" | null
    }
  ],
  "aiSummary": {
    "text": string,
    "model": "claude-3-haiku-20240307" | null,
    "generatedAt": "ISO timestamp"
  }
}
```

## Example Request

```bash
curl "http://localhost:3001/api/summary?businessId=demo-plumbing"
```

## Example Response

```json
{
  "businessId": "demo-plumbing",
  "dateRange": {
    "today": "2025-11-17",
    "last7DaysStart": "2025-11-10"
  },
  "metrics": {
    "today": {
      "totalLeads": 10,
      "new": 1,
      "collecting_info": 9,
      "qualified": 0,
      "scheduled": 0,
      "urgent": 2
    },
    "last7Days": {
      "totalLeads": 10,
      "new": 1,
      "collecting_info": 9,
      "qualified": 0,
      "scheduled": 0,
      "urgent": 2
    }
  },
  "appointments": [],
  "aiSummary": {
    "text": "Here's a brief daily summary:\n\nDaily Metrics Summary:\n- 10 total leads today, with 1 new lead and 9 leads collecting information\n- 2 urgent leads that need to be followed up on promptly\n- No leads have been qualified or scheduled yet\n\nNext Actions:\n- Follow up with the 2 urgent leads today to assess their needs\n- Reach out to the 9 leads collecting information to move them through the sales process\n- Focus on qualifying leads and scheduling appointments",
    "model": "claude-3-haiku-20240307",
    "generatedAt": "2025-11-17T09:47:13.912Z"
  }
}
```

## Fields Explained

### Date Range
- **today**: Current date in YYYY-MM-DD format
- **last7DaysStart**: Date 7 days ago in YYYY-MM-DD format

### Metrics
Counts of leads by status and urgency for two time periods:
- **today**: Leads created today
- **last7Days**: Leads created in the last 7 days

Metrics include:
- **totalLeads**: Total number of leads
- **new**: Leads with status "new"
- **collecting_info**: Leads with status "collecting_info"
- **qualified**: Leads with status "qualified"
- **scheduled**: Leads with status "scheduled"
- **urgent**: Leads with urgency "high" or "emergency"

### Appointments
List of leads that are ready for scheduling (status: "qualified" or "scheduled").

Each appointment includes:
- **id**: Unique appointment ID (prefixed with "apt-")
- **leadId**: Original lead ID
- **customerName**: Customer name (if available)
- **phone**: Customer phone number
- **issueSummary**: Brief description of the issue
- **scheduledTime**: Preferred appointment time (if specified)
- **status**: Current status ("qualified" or "scheduled")
- **urgency**: Priority level

### AI Summary
AI-generated operational insights using Claude 3 Haiku.

Fields:
- **text**: The summary text (2-4 paragraphs, operational focus)
- **model**: Model used ("claude-3-haiku-20240307" or null if fallback)
- **generatedAt**: ISO timestamp when summary was generated

## Fallback Behavior

If the Anthropic API is unavailable or the API key is missing, the endpoint returns a simple fallback summary:

```json
{
  "text": "Today you received X leads, with Y urgent and Z ready to book. Check the dashboard for details.",
  "model": null,
  "generatedAt": "2025-11-17T09:47:13.912Z"
}
```

## Use Cases

### Dashboard Summary Widget
Display today's key metrics and AI insights on the main dashboard.

```javascript
fetch('http://localhost:3001/api/summary?businessId=demo-plumbing')
  .then(res => res.json())
  .then(data => {
    console.log('Today:', data.metrics.today);
    console.log('AI Insights:', data.aiSummary.text);
  });
```

### Calendar View
Use the appointments array to populate a calendar with ready-to-schedule leads.

```javascript
const appointments = data.appointments.map(apt => ({
  title: apt.issueSummary || 'Service Request',
  phone: apt.phone,
  time: apt.scheduledTime,
  priority: apt.urgency
}));
```

### Daily Email Digest
Send the AI summary text to business owners via email each morning.

### Metrics Dashboard
Display trend graphs comparing today vs last 7 days.

## Implementation Details

### Backend Functions

**aiClient.js:**
- `generateDailySummary({ businessId, metrics, appointments })` - Generates AI summary

**leadStore.js:**
- `getMetricsForPeriods(businessId)` - Computes metrics for today and last 7 days
- `getAppointments(businessId)` - Returns qualified/scheduled leads as appointments
- `isToday(dateString)` - Helper to check if date is today
- `isWithinLastNDays(dateString, days)` - Helper for date range filtering

**index.js:**
- `GET /api/summary` - Main endpoint handler

### Date Handling

- Uses JavaScript Date objects
- "Today" is determined by calendar day in server's local time
- "Last 7 days" is 7 * 24 hours from current time
- All dates returned in ISO format (YYYY-MM-DD)

### AI Model

- Model: `claude-3-haiku-20240307` (fast, cost-effective)
- Max tokens: 300
- System prompt: Focuses on operational insights, no marketing fluff
- Timeout: Falls back to simple summary if API fails

## Error Handling

### Missing Business ID
Returns 200 with default businessId "demo-plumbing"

### API Errors
Returns 500 with error message:
```json
{
  "error": "Failed to generate summary"
}
```

### Missing API Key
Still returns 200 with fallback AI summary (model: null)

## Performance

- Typical response time: 1-2 seconds (includes AI generation)
- Fast path (no AI): <100ms
- Cached in-memory (leads already loaded)

## Testing

```bash
# Test with default business
curl "http://localhost:3001/api/summary"

# Test with specific business
curl "http://localhost:3001/api/summary?businessId=demo-plumbing"

# Pretty print JSON
curl -s "http://localhost:3001/api/summary" | python3 -m json.tool

# Test error handling (stop backend)
pkill -f "node index.js"
curl "http://localhost:3001/api/summary"  # Should fail
```

## Next Steps

Potential enhancements:
- [ ] Cache AI summaries (1 per day)
- [ ] Add week-over-week comparison
- [ ] Include revenue metrics
- [ ] Add trend indicators (↑↓)
- [ ] Support custom date ranges
- [ ] Multi-business summaries
- [ ] Email delivery option
- [ ] Slack/SMS notifications
