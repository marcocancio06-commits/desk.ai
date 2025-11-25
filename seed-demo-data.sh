#!/bin/bash

# Script to populate Desk.ai with 10 demo leads
# Run this after starting the backend server

BACKEND_URL="http://localhost:3001"

echo "🔧 Populating Desk.ai with demo leads..."
echo ""

# Check if backend is running
if ! curl -s "${BACKEND_URL}/health" > /dev/null 2>&1; then
    echo "❌ Backend is not running on ${BACKEND_URL}"
    echo "   Start it with: cd frontdesk-backend && npm run dev"
    exit 1
fi

echo "✅ Backend is running"
echo ""

# Lead 1 - Emergency water heater burst
echo "Creating lead 1/10 - Emergency case..."
curl -s -X POST ${BACKEND_URL}/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "from": "713-555-0001",
    "channel": "web",
    "message": "EMERGENCY! Water heater just burst in my garage. Water everywhere! I am in 77005."
  }' > /dev/null

sleep 1

# Lead 2 - Regular drain cleaning
echo "Creating lead 2/10 - Drain cleaning..."
curl -s -X POST ${BACKEND_URL}/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "from": "832-555-0002",
    "channel": "sms",
    "message": "Hi, I need someone to clean my kitchen drain. Its draining really slow. Im in 77030."
  }' > /dev/null

sleep 1

# Lead 3 - Water heater installation quote
echo "Creating lead 3/10 - Installation quote..."
curl -s -X POST ${BACKEND_URL}/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "from": "281-555-0003",
    "channel": "web",
    "message": "What are your rates for installing a new 50 gallon water heater in zip 77098? Looking to schedule next week."
  }' > /dev/null

sleep 1

# Lead 4 - Leaky faucet
echo "Creating lead 4/10 - Faucet repair..."
curl -s -X POST ${BACKEND_URL}/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "from": "713-555-0004",
    "channel": "web",
    "message": "My bathroom faucet has been dripping for weeks. Can you fix it? Im in the 77007 area."
  }' > /dev/null

sleep 1

# Lead 5 - Toilet running constantly
echo "Creating lead 5/10 - Toilet issue..."
curl -s -X POST ${BACKEND_URL}/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "from": "832-555-0005",
    "channel": "sms",
    "message": "Toilet keeps running 24/7. Water bill is insane. Need help ASAP in 77019."
  }' > /dev/null

sleep 1

# Lead 6 - Pipe replacement
echo "Creating lead 6/10 - Pipe replacement..."
curl -s -X POST ${BACKEND_URL}/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "from": "281-555-0006",
    "channel": "web",
    "message": "Need to replace some old galvanized pipes in my house. Can you give me a quote? 77025 zip code."
  }' > /dev/null

sleep 1

# Lead 7 - Shower drain clog
echo "Creating lead 7/10 - Shower drain..."
curl -s -X POST ${BACKEND_URL}/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "from": "713-555-0007",
    "channel": "web",
    "message": "Shower drain is completely clogged. Water not draining at all. Can someone come today? Im in 77005."
  }' > /dev/null

sleep 1

# Lead 8 - Garbage disposal
echo "Creating lead 8/10 - Garbage disposal..."
curl -s -X POST ${BACKEND_URL}/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "from": "832-555-0008",
    "channel": "sms",
    "message": "My garbage disposal stopped working yesterday. Makes a humming sound but wont turn. 77027."
  }' > /dev/null

sleep 1

# Lead 9 - Sewer line inspection
echo "Creating lead 9/10 - Sewer inspection..."
curl -s -X POST ${BACKEND_URL}/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "from": "281-555-0009",
    "channel": "web",
    "message": "I think I have a sewer line problem. Multiple drains backing up. Can you do a camera inspection in 77056?"
  }' > /dev/null

sleep 1

# Lead 10 - Water pressure issues
echo "Creating lead 10/10 - Water pressure..."
curl -s -X POST ${BACKEND_URL}/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "from": "713-555-0010",
    "channel": "web",
    "message": "Water pressure in my shower is really low. Started about a week ago. Need someone to check it out. 77002."
  }' > /dev/null

echo ""
echo "✅ Created 10 demo leads!"
echo ""

# Show summary
echo "📊 Fetching lead summary..."
curl -s "${BACKEND_URL}/api/leads?businessId=demo-plumbing" | python3 -c "
import sys, json
data = json.load(sys.stdin)
stats = data['stats']
print(f\"\"\"
Total Leads: {stats['total']}
New: {stats['new']}
Collecting Info: {stats['collecting_info']}
Qualified: {stats['qualified']}
Scheduled: {stats['scheduled']}
Closed Won: {stats['closed_won']}
Closed Lost: {stats['closed_lost']}
\"\"\")"

echo ""
echo "🌐 View in dashboard: http://localhost:3000/dashboard/leads"
echo ""
