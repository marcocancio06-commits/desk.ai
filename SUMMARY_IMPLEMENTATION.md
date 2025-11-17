# Summary API Implementation - Complete Guide

## What Was Built

A new backend API endpoint that provides business owners with:
1. **Daily metrics** - Today and last 7 days lead counts
2. **Calendar-ready appointments** - Qualified/scheduled leads ready for booking
3. **AI-generated insights** - Operational summary using Claude 3 Haiku

## Files Modified

### 1. `/frontdesk-backend/aiClient.js`

**Added function: `generateDailySummary()`**

```javascript
async function generateDailySummary({ businessId, metrics, appointments }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  // Fallback if no API key
  if (!apiKey) {
    const todayLeads = metrics.today.totalLeads;
    const urgentCount = metrics.today.urgent || 0;
    const qualifiedCount = metrics.today.qualified || 0;
    
    return {
      text: `Today you received ${todayLeads} lead${todayLeads !== 1 ? 's' : ''}, with ${urgentCount} urgent and ${qualifiedCount} ready to book.`,
      model: null,
      generatedAt: new Date().toISOString()
    };
  }
  
  // Call Claude API for smart summary
  const systemPrompt = `You are an assistant generating a short operational summary for a small service business owner. 
Use 2-4 short paragraphs or bullet points.
No marketing fluff, focus on operational insights: volume, urgency, follow-ups, next actions.`;
  
  const userPrompt = `Generate a brief daily summary based on this data:

Today's metrics:
- Total leads: ${metrics.today.totalLeads}
- New: ${metrics.today.new}
- Collecting info: ${metrics.today.collecting_info}
- Qualified: ${metrics.today.qualified}
- Scheduled: ${metrics.today.scheduled}
- Urgent: ${metrics.today.urgent}

Last 7 days: ${metrics.last7Days.totalLeads} total leads
Appointments ready: ${appointments.length}

Provide a brief, actionable summary.`;
  
  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });
    
    return {
      text: response.content[0].text,
      model: 'claude-3-haiku-20240307',
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    // Fallback on error
    return { /* simple summary */ };
  }
}
```

**Export added:**
```javascript
module.exports = { handleCustomerMessage, generateDailySummary };
```

---

### 2. `/frontdesk-backend/leadStore.js`

**Added 3 new helper functions:**

```javascript
// Helper: Check if date is today
function isToday(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate();
}

// Helper: Check if date is within last N days
function isWithinLastNDays(dateString, days) {
  const date = new Date(dateString);
  const now = new Date();
  const nDaysAgo = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  
  return date >= nDaysAgo;
}

// Get metrics for today and last 7 days
function getMetricsForPeriods(businessId) {
  const businessLeads = leads.filter(lead => lead.businessId === businessId);
  
  const todayLeads = businessLeads.filter(l => isToday(l.createdAt));
  const last7DaysLeads = businessLeads.filter(l => isWithinLastNDays(l.createdAt, 7));
  
  const countByStatus = (leadsArray) => ({
    totalLeads: leadsArray.length,
    new: leadsArray.filter(l => l.status === 'new').length,
    collecting_info: leadsArray.filter(l => l.status === 'collecting_info').length,
    qualified: leadsArray.filter(l => l.status === 'qualified').length,
    scheduled: leadsArray.filter(l => l.status === 'scheduled').length,
    urgent: leadsArray.filter(l => l.urgency === 'high' || l.urgency === 'emergency').length
  });
  
  return {
    today: countByStatus(todayLeads),
    last7Days: countByStatus(last7DaysLeads)
  };
}

// Get appointments (qualified or scheduled leads)
function getAppointments(businessId) {
  const businessLeads = leads.filter(lead => lead.businessId === businessId);
  
  const appointmentLeads = businessLeads.filter(l => 
    l.status === 'qualified' || l.status === 'scheduled'
  );
  
  return appointmentLeads.map(lead => ({
    id: `apt-${lead.id}`,
    leadId: lead.id,
    customerName: lead.customerName,
    phone: lead.phone,
    issueSummary: lead.issueSummary,
    scheduledTime: lead.preferredTime,
    status: lead.status,
    urgency: lead.urgency
  }));
}
```

**Exports updated:**
```javascript
module.exports = {
  upsertLeadFromMessage,
  getLeadsForBusiness,
  getLeadById,
  getLeadStats,
  getMetricsForPeriods,  // NEW
  getAppointments        // NEW
};
```

---

### 3. `/frontdesk-backend/index.js`

**Added imports:**
```javascript
const { handleCustomerMessage, generateDailySummary } = require('./aiClient');
const { 
  upsertLeadFromMessage, 
  getLeadsForBusiness, 
  getLeadStats,
  getMetricsForPeriods,  // NEW
  getAppointments        // NEW
} = require('./leadStore');
```

**Added new route: GET /api/summary**

```javascript
// Get daily summary with metrics and AI-generated insights
app.get('/api/summary', async (req, res) => {
  const { businessId } = req.query;
  const targetBusinessId = businessId || 'demo-plumbing';
  
  try {
    // Get metrics for today and last 7 days
    const metrics = getMetricsForPeriods(targetBusinessId);
    
    // Get appointments (qualified or scheduled leads)
    const appointments = getAppointments(targetBusinessId);
    
    // Generate AI summary
    const aiSummary = await generateDailySummary({
      businessId: targetBusinessId,
      metrics,
      appointments
    });
    
    // Calculate date range
    const today = new Date();
    const last7DaysStart = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    // Return complete summary
    res.status(200).json({
      businessId: targetBusinessId,
      dateRange: {
        today: today.toISOString().split('T')[0],
        last7DaysStart: last7DaysStart.toISOString().split('T')[0]
      },
      metrics,
      appointments,
      aiSummary
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ 
      error: 'Failed to generate summary' 
    });
  }
});
```

---

## API Response Example

```bash
curl "http://localhost:3001/api/summary?businessId=demo-plumbing"
```

**Response:**
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
    "text": "Here's a brief daily summary:\n\nDaily Metrics Summary:\n- 10 total leads today, with 1 new lead and 9 leads collecting information\n- 2 urgent leads that need to be followed up on promptly\n- No leads have been qualified or scheduled yet\n\nNext Actions:\n- Follow up with the 2 urgent leads today\n- Reach out to the 9 leads collecting information\n- Focus on qualifying leads and scheduling appointments",
    "model": "claude-3-haiku-20240307",
    "generatedAt": "2025-11-17T09:47:13.912Z"
  }
}
```

---

## Testing

### 1. Basic Test
```bash
curl "http://localhost:3001/api/summary?businessId=demo-plumbing"
```

### 2. Pretty Print
```bash
curl -s "http://localhost:3001/api/summary?businessId=demo-plumbing" | python3 -m json.tool
```

### 3. Test with Default Business ID
```bash
curl "http://localhost:3001/api/summary"
# Uses demo-plumbing by default
```

### 4. Extract Just AI Summary
```bash
curl -s "http://localhost:3001/api/summary" | python3 -c "import sys,json; print(json.load(sys.stdin)['aiSummary']['text'])"
```

### 5. Check Metrics
```bash
curl -s "http://localhost:3001/api/summary" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"Today: {d['metrics']['today']['totalLeads']} leads, {d['metrics']['today']['urgent']} urgent\")"
```

---

## Key Features

### ✅ Date-Based Metrics
- **Today**: Leads created on current calendar day
- **Last 7 Days**: Leads created in last 7*24 hours
- Counts by status: new, collecting_info, qualified, scheduled
- Urgent count: leads with urgency "high" or "emergency"

### ✅ Appointments List
- Only includes qualified or scheduled leads
- Calendar-ready format with phone, issue, time
- Empty array if no appointments ready

### ✅ AI-Generated Summary
- Uses Claude 3 Haiku (cheap, fast)
- 2-4 paragraph operational summary
- Actionable insights and next steps
- Fallback if API unavailable

### ✅ Error Handling
- Graceful fallback if no API key
- Simple summary text if Claude fails
- 500 error only if complete endpoint failure

---

## Use Cases

### Dashboard Summary Widget
```javascript
fetch('/api/summary?businessId=demo-plumbing')
  .then(res => res.json())
  .then(data => {
    document.getElementById('today-leads').textContent = data.metrics.today.totalLeads;
    document.getElementById('urgent-count').textContent = data.metrics.today.urgent;
    document.getElementById('ai-insights').textContent = data.aiSummary.text;
  });
```

### Calendar Integration
```javascript
const appointments = data.appointments.map(apt => ({
  id: apt.id,
  title: `${apt.issueSummary} - ${apt.phone}`,
  start: apt.scheduledTime,
  urgency: apt.urgency
}));
// Feed to FullCalendar or similar
```

### Daily Email
Send `aiSummary.text` to business owner each morning via email service.

---

## Documentation Created

- **SUMMARY_API.md** - Complete API documentation
- **This file** - Implementation guide and examples

---

## Git Commit Message

```
Add backend summary + calendar-ready data API

- Create GET /api/summary endpoint for business owner dashboard
- Add generateDailySummary() in aiClient.js using Claude 3 Haiku
- Add getMetricsForPeriods() in leadStore.js for today/7-day metrics
- Add getAppointments() to get calendar-ready qualified leads
- Include AI-generated operational insights with fallback
- Return date range, metrics, appointments, and AI summary
- Support businessId query param (defaults to demo-plumbing)
- Add comprehensive API documentation in SUMMARY_API.md
```

---

## Summary

✅ **New endpoint**: GET /api/summary  
✅ **3 new functions**: generateDailySummary, getMetricsForPeriods, getAppointments  
✅ **AI integration**: Claude 3 Haiku with fallback  
✅ **Calendar-ready**: Appointments array for scheduling  
✅ **Metrics**: Today and last 7 days comparison  
✅ **Tested**: Working with demo data  
✅ **Documented**: Complete API guide  

The backend now provides everything needed for a comprehensive business owner dashboard!
