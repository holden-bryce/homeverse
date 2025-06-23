#!/bin/bash

# HomeVerse Development Server Script
# Run both backend and frontend without needing VS Code extensions

echo "🚀 Starting HomeVerse Development Servers..."
echo "================================"

# Function to kill processes on exit
cleanup() {
    echo -e "\n\n🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Set up cleanup on script exit
trap cleanup EXIT INT

# Start Backend
echo "📦 Starting Backend Server (Port 8000)..."
cd "$(dirname "$0")"
python3 supabase_backend.py &
BACKEND_PID=$!
echo "✅ Backend PID: $BACKEND_PID"

# Give backend time to start
sleep 3

# Start Frontend
echo -e "\n📦 Starting Frontend Server (Port 3000)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend PID: $FRONTEND_PID"

echo -e "\n================================"
echo "🎉 Development servers are running!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo -e "\n💡 Press Ctrl+C to stop all servers"
echo "================================"

# Keep script running
wait