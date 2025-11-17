#!/bin/bash

# Quick verification script to check if everything is working

echo "🔍 FrontDesk AI - System Check"
echo "================================"
echo ""

# Check if backend is running
echo -n "Backend (Port 3001)... "
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "❌ Not running"
    echo "   Start with: cd frontdesk-backend && npm run dev"
fi

# Check if frontend is running
echo -n "Frontend (Port 3000)... "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "❌ Not running"
    echo "   Start with: cd frontend && npm run dev"
fi

echo ""

# Check backend API
echo "📊 Backend API Status:"
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:3001/health)
    echo "   $HEALTH"
    
    LEADS=$(curl -s "http://localhost:3001/api/leads?businessId=demo-plumbing" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Total leads: {d[\"stats\"][\"total\"]}, Collecting info: {d[\"stats\"][\"collecting_info\"]}')" 2>/dev/null)
    echo "   $LEADS"
else
    echo "   ❌ Backend not responding"
fi

echo ""

# Check .env file
echo "🔐 Environment Check:"
if [ -f "frontdesk-backend/.env" ]; then
    echo "   ✅ .env file exists"
    if grep -q "ANTHROPIC_API_KEY" frontdesk-backend/.env; then
        echo "   ✅ ANTHROPIC_API_KEY configured"
    else
        echo "   ⚠️  ANTHROPIC_API_KEY not found in .env"
    fi
else
    echo "   ❌ .env file missing"
    echo "   Create with: cd frontdesk-backend && echo 'ANTHROPIC_API_KEY=your_key' > .env"
fi

echo ""

# Show URLs
echo "🌐 Access URLs:"
echo "   Homepage:  http://localhost:3000"
echo "   Chat Demo: http://localhost:3000/demo-chat"
echo "   Dashboard: http://localhost:3000/dashboard"
echo "   Leads:     http://localhost:3000/dashboard/leads"
echo ""
echo "   Backend:   http://localhost:3001"
echo "   Health:    http://localhost:3001/health"
echo ""

echo "✨ System check complete!"
