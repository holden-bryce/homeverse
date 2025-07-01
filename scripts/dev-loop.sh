#!/bin/bash

# HomeVerse Complete Development Loop
# Starts servers, opens browser, runs tests, and fixes failures

echo "================================================"
echo "🔄 HomeVerse Automated Development Loop"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Configuration
BROWSER_DELAY=5
TEST_DELAY=10
AUTO_FIX=${AUTO_FIX:-false}
WATCH_MODE=${WATCH_MODE:-false}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --auto-fix)
            AUTO_FIX=true
            shift
            ;;
        --watch)
            WATCH_MODE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --auto-fix   Automatically fix test failures with Claude"
            echo "  --watch      Keep running and watch for changes"
            echo ""
            echo "This script will:"
            echo "  1. Start backend and frontend servers"
            echo "  2. Open browser to view the app"
            echo "  3. Run E2E tests"
            echo "  4. Open test report"
            echo "  5. Optionally fix failures with Claude"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check if servers are already running
servers_running() {
    local backend=false
    local frontend=false
    
    curl -s http://localhost:8000/health > /dev/null 2>&1 && backend=true
    curl -s http://localhost:3000 > /dev/null 2>&1 && frontend=true
    
    if [ "$backend" = true ] && [ "$frontend" = true ]; then
        return 0
    else
        return 1
    fi
}

# Open browser
open_browser() {
    local url=$1
    echo -e "${CYAN}🌐 Opening browser to $url${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$url"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v xdg-open &> /dev/null; then
            xdg-open "$url"
        elif command -v google-chrome &> /dev/null; then
            google-chrome "$url" &
        elif command -v firefox &> /dev/null; then
            firefox "$url" &
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
        start "$url"
    fi
}

# Run the development loop
run_loop() {
    echo -e "${YELLOW}🚀 Starting development loop...${NC}"
    echo ""
    
    # Step 1: Start servers if not running
    if ! servers_running; then
        echo -e "${BLUE}Starting servers...${NC}"
        "$SCRIPT_DIR/start-local-dev.sh" &
        SERVER_PID=$!
        
        # Wait for servers to be ready
        echo "⏳ Waiting for servers to start..."
        sleep 15
        
        if ! servers_running; then
            echo -e "${RED}❌ Failed to start servers${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Servers already running${NC}"
    fi
    
    # Step 2: Open browser
    echo ""
    echo -e "${BLUE}Opening application in browser...${NC}"
    open_browser "http://localhost:3000"
    sleep $BROWSER_DELAY
    
    # Step 3: Run tests
    echo ""
    echo -e "${BLUE}Waiting ${TEST_DELAY}s before running tests...${NC}"
    sleep $TEST_DELAY
    
    # Run tests with optional auto-fix
    if [ "$AUTO_FIX" = true ]; then
        "$SCRIPT_DIR/test-and-fix.sh" --auto-fix
    else
        "$SCRIPT_DIR/test-and-fix.sh"
    fi
    
    TEST_EXIT_CODE=$?
    
    # Step 4: Summary
    echo ""
    echo "================================================"
    echo -e "${GREEN}📊 Development Loop Complete${NC}"
    echo "================================================"
    echo -e "🌐 App URL:     ${BLUE}http://localhost:3000${NC}"
    echo -e "📚 API Docs:    ${BLUE}http://localhost:8000/docs${NC}"
    echo -e "📈 Test Report: ${BLUE}http://localhost:9323${NC}"
    
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        echo -e "✅ Status:      ${GREEN}All tests passing!${NC}"
    else
        echo -e "⚠️  Status:      ${YELLOW}Some tests failing${NC}"
    fi
    
    return $TEST_EXIT_CODE
}

# Watch mode - keep running tests on file changes
watch_loop() {
    echo -e "${CYAN}👁️  Watch mode enabled${NC}"
    echo "Watching for changes in:"
    echo "  - $PROJECT_ROOT/frontend/src"
    echo "  - $PROJECT_ROOT/frontend/tests"
    echo ""
    
    while true; do
        run_loop
        
        echo ""
        echo -e "${CYAN}Watching for changes... (Press Ctrl+C to stop)${NC}"
        
        # Use inotifywait if available, otherwise use a simple sleep loop
        if command -v inotifywait &> /dev/null; then
            inotifywait -r -e modify,create,delete \
                "$PROJECT_ROOT/frontend/src" \
                "$PROJECT_ROOT/frontend/tests" \
                --exclude "node_modules|\.next|\.git" \
                2>/dev/null
        else
            sleep 30
        fi
        
        echo -e "${YELLOW}Changes detected! Re-running tests...${NC}"
        sleep 2
    done
}

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping development loop...${NC}"
    
    # Kill server process if we started it
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
        
        # Also kill the actual server processes
        if [ -f "$PROJECT_ROOT/.server_pids" ]; then
            cat "$PROJECT_ROOT/.server_pids" | xargs kill 2>/dev/null
            rm -f "$PROJECT_ROOT/.server_pids"
        fi
    fi
    
    echo -e "${GREEN}✅ Development loop stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    if [ "$WATCH_MODE" = true ]; then
        watch_loop
    else
        run_loop
        exit_code=$?
        
        echo ""
        echo -e "${CYAN}💡 Tip: Use --watch flag to automatically re-run tests on file changes${NC}"
        echo -e "${CYAN}💡 Tip: Use --auto-fix flag to automatically fix test failures${NC}"
        
        exit $exit_code
    fi
}

# Make scripts executable
chmod +x "$SCRIPT_DIR"/*.sh 2>/dev/null

# Run main function
main