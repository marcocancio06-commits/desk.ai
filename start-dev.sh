#!/bin/bash

# FrontDesk AI - Development Startup Script
# This script starts both the backend and frontend servers

echo "🚀 Starting FrontDesk AI Development Servers..."
echo ""

# Check if .env exists in backend
if [ ! -f "frontdesk-backend/.env" ]; then
    echo "⚠️  Warning: frontdesk-backend/.env not found!"
    echo "   Create it with: ANTHROPIC_API_KEY=your_key_here"
    echo ""
fi

# Start backend
echo "📡 Starting Backend (Port 3001)..."
cd frontdesk-backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend
echo "🌐 Starting Frontend (Port 3000)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Servers started!"
echo ""
echo "📊 Backend:  http://localhost:3001"
echo "   Health:   http://localhost:3001/health"
echo "   API:      http://localhost:3001/api/leads?businessId=demo-plumbing"
echo ""
echo "🎨 Frontend: http://localhost:3000"
echo "   Home:     http://localhost:3000"
echo "   Chat:     http://localhost:3000/demo-chat"
echo "   Dashboard: http://localhost:3000/dashboard"
echo ""
echo "🛑 To stop servers: Press Ctrl+C or run: pkill -f 'node index.js' && pkill -f 'next dev'"
echo ""

# Wait for user to stop
wait
