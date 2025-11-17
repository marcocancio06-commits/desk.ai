# ✅ Local Development Setup - VERIFIED

## Current Status (November 17, 2025)

**Both servers are running and fully functional!**

### 🟢 Backend (Port 3001)
- Status: **RUNNING**
- Health: http://localhost:3001/health → `{"status":"ok"}`
- Leads API: Working with 3 test leads
- AI Integration: Claude API configured

### 🟢 Frontend (Port 3000)
- Status: **RUNNING**
- Homepage: http://localhost:3000 → Accessible
- Demo Chat: http://localhost:3000/demo-chat → Working
- Dashboard: http://localhost:3000/dashboard → Connected to backend
- Leads Page: http://localhost:3000/dashboard/leads → Showing real data

### 🔐 Configuration
- ✅ `.env` file exists with ANTHROPIC_API_KEY
- ✅ Backend URL configured: http://localhost:3001
- ✅ Business ID: demo-plumbing

---

## How to Use

### Starting Servers

**Option 1: Individual Commands (Recommended for development)**

Terminal 1 - Backend:
```bash
cd frontdesk-backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

**Option 2: Startup Script**
```bash
./start-dev.sh
```

### Checking Status
```bash
./check-status.sh
```

### Stopping Servers

**Kill all processes:**
```bash
pkill -f "node index.js"  # Backend
pkill -f "next dev"       # Frontend
```

**Or use Ctrl+C in each terminal**

---

## npm run dev Commands

### Backend (`frontdesk-backend/`)
```bash
cd frontdesk-backend
npm run dev
```
- Runs: `node index.js`
- Starts Express server on port 3001
- Loads environment variables from `.env`
- No hot reload (restart needed for changes)

### Frontend (`frontend/`)
```bash
cd frontend
npm run dev
```
- Runs: `next dev`
- Starts Next.js development server on port 3000
- **Hot reload enabled** - changes reflect automatically
- Includes React Fast Refresh

---

## Testing the Site

### 1. Homepage
Visit: http://localhost:3000
- Should show "FrontDesk AI" title
- Two buttons: "Owner Dashboard" and "Try Demo Chat"

### 2. Demo Chat
Visit: http://localhost:3000/demo-chat
1. Enter phone number: `555-TEST-123`
2. Type message: `"I need plumbing help in 77005"`
3. Click Send
4. AI responds and extracts data
5. Check debug panel on right side

### 3. Dashboard
Visit: http://localhost:3000/dashboard
- Shows real stats from backend
- "Collecting Info: 3" (current test leads)
- Recent activity shows lead table
- All data is live from backend API

### 4. Leads Page
Visit: http://localhost:3000/dashboard/leads
- Shows all 3 test leads in table
- Click filter tabs to filter by status
- See phone numbers, messages, timestamps
- All connected to real backend data

---

## Current Test Data

Backend has **3 test leads**:

1. **555-TEST-001**
   - Status: collecting_info
   - Issue: water heater burst
   - ZIP: 77005
   - Urgency: emergency

2. **555-TEST-002**
   - Status: collecting_info
   - Issue: (not specified yet)
   - ZIP: 77030
   - Urgency: normal
   - Preferred time: next Tuesday

3. **555-TEST-003**
   - Status: collecting_info
   - Issue: water heater installation
   - ZIP: 77098
   - Urgency: normal

---

## What Works

✅ Backend server running (Express on port 3001)  
✅ Frontend server running (Next.js on port 3000)  
✅ AI integration (Claude API)  
✅ Lead persistence (in-memory)  
✅ Dashboard shows real data  
✅ Chat creates leads  
✅ Leads page displays conversations  
✅ Hot reload on frontend  
✅ Error handling  
✅ Loading states  
✅ CORS enabled  
✅ Environment variables loaded  

---

## Quick Commands Reference

```bash
# Check if servers are running
./check-status.sh

# Start backend only
cd frontdesk-backend && npm run dev

# Start frontend only
cd frontend && npm run dev

# Create a test lead via API
curl -X POST http://localhost:3001/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "from": "555-NEW-LEAD",
    "channel": "web",
    "message": "Emergency plumbing needed!"
  }'

# View all leads
curl http://localhost:3001/api/leads?businessId=demo-plumbing

# Stop all processes
pkill -f "node index.js" && pkill -f "next dev"
```

---

## Files Created

- ✅ `start-dev.sh` - Startup script for both servers
- ✅ `check-status.sh` - System verification script
- ✅ `DEV_GUIDE.md` - Complete development guide
- ✅ This file - Verification summary

---

## Next Time You Start

1. Open terminal 1: `cd frontdesk-backend && npm run dev`
2. Open terminal 2: `cd frontend && npm run dev`
3. Visit: http://localhost:3000
4. Test chat at: http://localhost:3000/demo-chat
5. View dashboard at: http://localhost:3000/dashboard

**That's it! Everything is configured and ready to use.** 🎉

---

Last verified: November 17, 2025 at 3:24 AM
Backend: Running ✅
Frontend: Running ✅
Status: All systems operational 🟢
