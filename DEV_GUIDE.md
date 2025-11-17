# FrontDesk AI - Development Guide

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm
- Anthropic API key (get one at https://console.anthropic.com/)

### Setup

1. **Install Dependencies**
   ```bash
   # Backend
   cd frontdesk-backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Create .env file in frontdesk-backend/
   cd frontdesk-backend
   echo "PORT=3001" > .env
   echo "ANTHROPIC_API_KEY=your_api_key_here" >> .env
   ```

### Running Locally

#### Option 1: Use the startup script (Easiest)
```bash
./start-dev.sh
```

#### Option 2: Manual start (Two terminals)

**Terminal 1 - Backend:**
```bash
cd frontdesk-backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Verify Everything Works

1. **Check Backend:**
   ```bash
   curl http://localhost:3001/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

2. **Open Frontend:**
   - Homepage: http://localhost:3000
   - Demo Chat: http://localhost:3000/demo-chat
   - Dashboard: http://localhost:3000/dashboard
   - Leads: http://localhost:3000/dashboard/leads

### Test the Full Flow

1. **Create a test lead via chat:**
   - Go to http://localhost:3000/demo-chat
   - Enter phone: `555-TEST-001`
   - Send message: `"I need emergency plumbing in 77005"`
   - AI will respond and extract data

2. **View lead in dashboard:**
   - Go to http://localhost:3000/dashboard
   - Should see 1 lead in "Collecting Info"
   - Click on "Leads" in sidebar to see full details

3. **Or create lead via API:**
   ```bash
   curl -X POST http://localhost:3001/api/message \
     -H "Content-Type: application/json" \
     -d '{
       "businessId": "demo-plumbing",
       "from": "555-API-TEST",
       "channel": "web",
       "message": "Need drain cleaning in 77030"
     }'
   ```

### Available Scripts

#### Backend (`frontdesk-backend/`)
- `npm run dev` - Start development server
- `npm start` - Start production server

#### Frontend (`frontend/`)
- `npm run dev` - Start Next.js development server (with hot reload)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run linter

### Project Structure

```
agency-mvp/
├── frontdesk-backend/          # Express.js backend
│   ├── index.js               # Main server file
│   ├── aiClient.js            # Claude AI integration
│   ├── businessConfig.js      # Business profile data
│   ├── leadStore.js           # In-memory lead storage
│   ├── package.json
│   └── .env                   # Environment variables
│
├── frontend/                   # Next.js frontend
│   ├── pages/
│   │   ├── index.js           # Homepage
│   │   ├── demo-chat.js       # Customer chat interface
│   │   ├── dashboard/
│   │   │   ├── index.js       # Dashboard overview
│   │   │   ├── leads.js       # Leads management
│   │   │   ├── calendar.js    # Calendar (placeholder)
│   │   │   ├── settings.js    # Settings (placeholder)
│   │   │   └── components/    # Reusable components
│   │   └── api/
│   │       └── leads.js       # API proxy to backend
│   ├── lib/
│   │   ├── config.js          # Frontend config
│   │   └── dummyLeads.js      # Sample data (not used)
│   ├── package.json
│   └── tailwind.config.js
│
├── start-dev.sh               # Development startup script
├── TESTING.md                 # Testing guide
├── DASHBOARD_INTEGRATION.md   # Integration docs
└── README.md                  # This file
```

### API Endpoints

#### Backend (http://localhost:3001)

**GET /health**
- Health check endpoint
- Returns: `{ "status": "ok", "timestamp": "..." }`

**POST /api/message**
- Process customer message through AI
- Body: `{ businessId, from, channel, message }`
- Returns: AI response + lead summary

**GET /api/leads?businessId=demo-plumbing**
- Fetch all leads for a business
- Returns: `{ leads: [...], stats: {...}, count: n }`

#### Frontend (http://localhost:3000)

All frontend pages are served by Next.js:
- `/` - Homepage
- `/demo-chat` - Customer chat demo
- `/dashboard` - Business owner dashboard
- `/dashboard/leads` - Leads management
- `/dashboard/calendar` - Calendar view
- `/dashboard/settings` - Settings

### Troubleshooting

#### Backend won't start
```bash
# Check if port 3001 is in use
lsof -ti:3001

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Restart backend
cd frontdesk-backend
npm run dev
```

#### Frontend won't start
```bash
# Check if port 3000 is in use
lsof -ti:3000

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Restart frontend
cd frontend
npm run dev
```

#### Dashboard shows "Failed to load leads"
- Make sure backend is running on port 3001
- Check backend health: `curl http://localhost:3001/health`
- Check browser console for errors
- Verify CORS is enabled in backend

#### AI not responding / Fallback messages
- Check if `ANTHROPIC_API_KEY` is set in `frontdesk-backend/.env`
- Verify API key is valid at https://console.anthropic.com/
- Check backend console for error messages
- Fallback response: "Thanks for your message — a team member will follow up shortly."

### Environment Variables

#### Backend (.env)
```bash
PORT=3001
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

#### Frontend (optional)
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### Development Tips

1. **Hot Reload**: Both servers support hot reload - changes will reflect automatically
2. **Console Logs**: Check terminal output for backend logs
3. **Browser DevTools**: Use Network tab to debug API calls
4. **In-Memory Storage**: Leads are stored in memory - restart clears all data

### Next Steps

- [ ] Replace in-memory storage with PostgreSQL/MongoDB
- [ ] Add user authentication
- [ ] Implement real-time updates (WebSockets)
- [ ] Add SMS integration (Twilio)
- [ ] Deploy to production

### Support

See detailed documentation:
- `TESTING.md` - Complete testing guide
- `DASHBOARD_INTEGRATION.md` - Integration details
- GitHub: https://github.com/marcocancio06-commits/desk.ai
