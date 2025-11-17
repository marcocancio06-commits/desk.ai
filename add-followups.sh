#!/bin/bash

# Script to add follow-up messages to some leads to show conversation flow
# This makes the demo more realistic

BACKEND_URL="http://localhost:3001"

echo "💬 Adding follow-up conversations to demo leads..."
echo ""

# Follow-up for emergency water heater (Lead 1)
echo "Adding conversation for emergency case..."
curl -s -X POST ${BACKEND_URL}/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "from": "713-555-0001",
    "channel": "web",
    "message": "Yes please send someone NOW! The water is ruining my garage floor!"
  }' > /dev/null

sleep 1

# Follow-up for drain cleaning (Lead 2)
echo "Adding conversation for drain cleaning..."
curl -s -X POST ${BACKEND_URL}/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "from": "832-555-0002",
    "channel": "sms",
    "message": "I can do tomorrow afternoon around 2pm if you have availability"
  }' > /dev/null

sleep 1

# Follow-up for water heater quote (Lead 3)
echo "Adding conversation for installation quote..."
curl -s -X POST ${BACKEND_URL}/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "from": "281-555-0003",
    "channel": "web",
    "message": "Yes please! Tuesday or Wednesday next week works best for me."
  }' > /dev/null

sleep 1

# Follow-up for shower drain (Lead 7)
echo "Adding conversation for shower drain..."
curl -s -X POST ${BACKEND_URL}/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "from": "713-555-0007",
    "channel": "web",
    "message": "Its been clogged for 3 days now. Using my kids bathroom. Can you come this afternoon?"
  }' > /dev/null

sleep 1

# Follow-up for garbage disposal (Lead 8)
echo "Adding conversation for garbage disposal..."
curl -s -X POST ${BACKEND_URL}/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "demo-plumbing",
    "from": "832-555-0008",
    "channel": "sms",
    "message": "I tried the reset button already. Still not working. Morning appointment tomorrow would be great."
  }' > /dev/null

echo ""
echo "✅ Added follow-up conversations!"
echo ""
echo "🌐 View conversations: http://localhost:3000/dashboard/leads"
echo ""
