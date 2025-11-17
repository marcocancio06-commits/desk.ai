# 🎯 Quick Reference - Demo Data

## Current Status
✅ **13 Demo Leads** loaded and ready
- 10 unique customers with realistic plumbing issues
- 5 leads have follow-up conversations (multi-message threads)
- Mix of emergency, urgent, and normal priority

## Quick Commands

### Populate Demo Data (Fresh Start)
```bash
./seed-demo-data.sh
```

### Add Follow-up Conversations
```bash
./add-followups.sh
```

### Check Current Data
```bash
curl "http://localhost:3001/api/leads?businessId=demo-plumbing" | python3 -m json.tool
```

### Reset Everything
```bash
# Kill backend (clears in-memory data)
pkill -f "node index.js"

# Restart backend
cd frontdesk-backend && npm run dev

# Repopulate (in another terminal)
./seed-demo-data.sh && ./add-followups.sh
```

## View Demo Data

### Dashboard Overview
http://localhost:3000/dashboard
- Shows: 13 total leads
- All in "Collecting Info" status
- Recent activity table

### All Leads
http://localhost:3000/dashboard/leads
- Full lead table
- Filter by status
- Search functionality

### Demo Chat
http://localhost:3000/demo-chat
- Add more leads interactively
- Test AI responses
- See real-time lead creation

## Demo Lead Highlights

### 🚨 Emergency Case
**713-555-0001** - Water heater burst
- Urgency: Emergency
- ZIP: 77005
- 2 messages showing panic

### 💰 Quote Request  
**281-555-0003** - Water heater installation
- Wants pricing
- Ready to schedule
- ZIP: 77098

### ⏰ Same-Day Request
**713-555-0007** - Clogged shower drain
- Wants today
- 2 messages
- ZIP: 77005

### 🔧 Technical Issue
**832-555-0008** - Garbage disposal
- Already troubleshot
- Wants morning appointment
- ZIP: 77027

## Demo Data Breakdown

| Metric | Count |
|--------|-------|
| Total Leads | 13 |
| Emergency | 1 |
| Urgent/High | 2 |
| Normal | 9 |
| ZIP Codes Covered | 9 |
| Multi-message Leads | 5 |
| Single-message Leads | 8 |

## Geographic Coverage
- 77005: 3 leads (Museum District)
- 77030: 2 leads (Medical Center)
- 77098: 2 leads (Upper Kirby)
- 77002, 77007, 77019, 77025, 77027, 77056: 1 each

## Issue Types
- 🚰 Drains: 4 leads
- 🔥 Water heaters: 2 leads
- 🚽 Fixtures: 2 leads
- 🔧 Infrastructure: 2 leads

## Files Created
- ✅ `seed-demo-data.sh` - Creates 10 leads
- ✅ `add-followups.sh` - Adds conversations
- ✅ `DEMO_DATA.md` - Complete documentation

## Testing Scenarios

1. **Filter Test**: Click different status tabs on leads page
2. **Search Test**: Search for "713-555" or "77005"
3. **Conversation Test**: View leads with 2+ messages
4. **Add Lead Test**: Use demo chat to create new lead
5. **Stats Test**: Check dashboard shows correct counts

---

**Last Updated**: November 17, 2025  
**Total Demo Leads**: 13  
**Status**: All ready for demo! 🎉
