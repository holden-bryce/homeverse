#!/bin/bash

# HomeVerse Local Development Starter
# This script starts both backend and frontend servers

echo "================================================"
echo "🚀 Starting HomeVerse Development Environment"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Kill any existing processes on our ports
echo "🔄 Cleaning up existing processes..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2

# Start backend server
echo -e "${YELLOW}Starting backend server...${NC}"
cd "$PROJECT_ROOT"
(
    python3 supabase_backend.py 2>&1 | while IFS= read -r line; do
        echo -e "${BLUE}[BACKEND]${NC} $line"
    done
) &
BACKEND_PID=$!

# Start frontend server
echo -e "${YELLOW}Starting frontend server...${NC}"
cd "$PROJECT_ROOT/frontend"
(
    npm run dev 2>&1 | while IFS= read -r line; do
        echo -e "${GREEN}[FRONTEND]${NC} $line"
    done
) &
FRONTEND_PID=$!

# Function to check if server is responding
check_server() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            return 0
        fi
        echo -e "${YELLOW}⏳ Waiting for $name to start... (attempt $attempt/$max_attempts)${NC}"
        sleep 2
        ((attempt++))
    done
    return 1
}

# Wait for servers to be ready
echo ""
echo "⏳ Waiting for servers to start..."

# Check backend
if check_server "http://localhost:8000/health" "backend"; then
    echo -e "${GREEN}✅ Backend server is running${NC}"
else
    echo -e "${RED}❌ Backend server failed to start${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

# Check frontend
if check_server "http://localhost:3000" "frontend"; then
    echo -e "${GREEN}✅ Frontend server is running${NC}"
else
    echo -e "${RED}❌ Frontend server failed to start${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "================================================"
echo -e "${GREEN}✅ HomeVerse is running!${NC}"
echo "================================================"
echo -e "📍 Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "📍 Backend:  ${BLUE}http://localhost:8000${NC}"
echo -e "📍 API Docs: ${BLUE}http://localhost:8000/docs${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Store PIDs for cleanup
echo "$BACKEND_PID $FRONTEND_PID" > "$PROJECT_ROOT/.server_pids"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    rm -f "$PROJECT_ROOT/.server_pids"
    echo "✅ Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
wait $BACKEND_PID $FRONTEND_PID