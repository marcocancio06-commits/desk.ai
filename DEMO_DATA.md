# Demo Data Guide

## Overview

Your FrontDesk AI now has **10 realistic demo leads** populated with actual plumbing service requests.

## Demo Leads Summary

### 1. Emergency - Water Heater Burst 🚨
- **Phone**: 713-555-0001
- **Issue**: Water heater burst in garage
- **ZIP**: 77005
- **Urgency**: Emergency
- **Status**: Collecting info
- **Messages**: 2 (initial + follow-up)

### 2. Drain Cleaning
- **Phone**: 832-555-0002  
- **Issue**: Slow kitchen drain
- **ZIP**: 77030
- **Urgency**: Normal
- **Status**: Collecting info
- **Messages**: 2 (with scheduling preference)

### 3. Water Heater Installation Quote
- **Phone**: 281-555-0003
- **Issue**: New 50-gallon water heater installation
- **ZIP**: 77098
- **Urgency**: Normal
- **Status**: Collecting info
- **Messages**: 2 (interested in booking)

### 4. Faucet Repair
- **Phone**: 713-555-0004
- **Issue**: Dripping bathroom faucet
- **ZIP**: 77007
- **Urgency**: Normal
- **Status**: Collecting info
- **Messages**: 1

### 5. Toilet Running
- **Phone**: 832-555-0005
- **Issue**: Toilet running constantly
- **ZIP**: 77019
- **Urgency**: High (urgent)
- **Status**: Collecting info
- **Messages**: 1

### 6. Pipe Replacement
- **Phone**: 281-555-0006
- **Issue**: Replace old galvanized pipes
- **ZIP**: 77025
- **Urgency**: Normal
- **Status**: Collecting info
- **Messages**: 1

### 7. Shower Drain Clog
- **Phone**: 713-555-0007
- **Issue**: Completely clogged shower drain
- **ZIP**: 77005
- **Urgency**: Normal
- **Status**: Collecting info
- **Messages**: 2 (wants same-day service)

### 8. Garbage Disposal
- **Phone**: 832-555-0008
- **Issue**: Garbage disposal not working
- **ZIP**: 77027
- **Urgency**: Normal
- **Status**: Collecting info
- **Messages**: 2 (tried troubleshooting)

### 9. Sewer Line Inspection
- **Phone**: 281-555-0009
- **Issue**: Multiple drains backing up
- **ZIP**: 77056
- **Urgency**: Normal
- **Status**: Collecting info
- **Messages**: 1

### 10. Water Pressure Issues
- **Phone**: 713-555-0010
- **Issue**: Low shower water pressure
- **ZIP**: 77002
- **Urgency**: Normal
- **Status**: Collecting info
- **Messages**: 1

## Scripts

### Create Demo Data
```bash
./seed-demo-data.sh
```
Creates 10 initial demo leads with diverse plumbing issues.

### Add Follow-up Conversations
```bash
./add-followups.sh
```
Adds follow-up messages to 5 leads to show conversation flow.

### Reset Demo Data
```bash
# Restart the backend server to clear in-memory data
pkill -f "node index.js"
cd frontdesk-backend && npm run dev

# Then repopulate
./seed-demo-data.sh
./add-followups.sh
```

## Viewing Demo Data

### Dashboard Overview
http://localhost:3000/dashboard
- Shows total: 13 leads (10 new + 3 from earlier)
- All in "Collecting Info" status
- Stats breakdown

### Leads Page  
http://localhost:3000/dashboard/leads
- Full table view of all leads
- Filter by status
- See phone numbers, issues, ZIP codes
- Click to view conversation history

### Individual Lead Details
Currently leads are displayed in table format. Click on any lead row to see:
- Full conversation history
- Extracted data (issue, ZIP, urgency)
- Timestamps
- Customer phone number

## Demo Scenarios

### 1. Emergency Response
**Lead**: 713-555-0001 (Water heater burst)
- Shows urgent/emergency handling
- Multiple messages showing panic
- Tests AI's ability to prioritize

### 2. Quote Request
**Lead**: 281-555-0003 (Water heater installation)
- Customer asking for pricing
- Shows scheduling preference
- Tests AI's quote handling

### 3. Same-Day Service
**Lead**: 713-555-0007 (Shower drain)
- Customer wants immediate help
- Multiple messages
- Shows urgency escalation

### 4. Troubleshooting
**Lead**: 832-555-0008 (Garbage disposal)
- Customer already tried basic fixes
- Shows technical conversation
- Tests AI's problem-solving

## Data Characteristics

### Geographic Distribution
- 77005 (2 leads) - Museum District
- 77030 (1 lead) - Medical Center  
- 77098 (1 lead) - Upper Kirby
- 77007 (1 lead) - Heights
- 77019 (1 lead) - River Oaks
- 77025 (1 lead) - Braeswood
- 77027 (1 lead) - Afton Oaks
- 77056 (1 lead) - Galleria
- 77002 (1 lead) - Downtown

### Urgency Levels
- Emergency: 1 lead (water heater burst)
- High/Urgent: 1 lead (running toilet)
- Normal: 8 leads

### Issue Types
- Water heaters: 2 (emergency + installation)
- Drains: 4 (kitchen, shower, sewer, disposal)
- Fixtures: 2 (faucet, toilet)
- Infrastructure: 2 (pipes, water pressure)

### Message Count
- 1 message: 5 leads (initial contact only)
- 2 messages: 5 leads (with follow-up)

## Testing with Demo Data

### Filter by Status
1. Go to `/dashboard/leads`
2. Click "All Leads" - should show 13
3. Click "Collecting Info" - should show 13
4. Other filters show 0 (no leads in those stages yet)

### Search Functionality
- Search by phone: `713-555-0001`
- Search by ZIP: `77005`
- Search by issue: `water heater`

### Create More Leads
Use the demo chat to add more:
```
Phone: 713-555-9999
Message: "I have a leaky pipe under my sink in 77005"
```

### View Conversation Flow
Leads with 2+ messages show the back-and-forth:
- Customer initial request
- AI response with questions
- Customer follow-up with answers
- AI collecting more details

## Refreshing Demo Data

Since leads are stored in-memory, they persist until you restart the backend.

**To start fresh:**
1. Stop backend: `pkill -f "node index.js"`
2. Start backend: `cd frontdesk-backend && npm run dev`
3. Repopulate: `./seed-demo-data.sh && ./add-followups.sh`

**To keep adding:**
- Run `./seed-demo-data.sh` again (adds 10 more)
- Or use the chat UI to add individual leads

## Next Steps

With this demo data, you can:

✅ Show the dashboard to stakeholders  
✅ Demonstrate lead management  
✅ Test filtering and search  
✅ Show conversation tracking  
✅ Demo the AI's data extraction  
✅ Display urgency handling  
✅ Show geographic coverage  

The demo data represents realistic scenarios a plumbing business would encounter daily!
