#!/bin/bash

# HomeVerse Test Runner with Auto-Fix
# This script runs E2E tests and can automatically fix failures

echo "================================================"
echo "🧪 HomeVerse E2E Test Runner & Auto-Fixer"
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
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Parse command line arguments
RUN_TESTS=true
OPEN_REPORT=true
AUTO_FIX=false
TEST_SUITE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-tests)
            RUN_TESTS=false
            shift
            ;;
        --no-report)
            OPEN_REPORT=false
            shift
            ;;
        --auto-fix)
            AUTO_FIX=true
            shift
            ;;
        --suite)
            TEST_SUITE="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --no-tests     Skip running tests (just open report)"
            echo "  --no-report    Don't open report after tests"
            echo "  --auto-fix     Automatically fix test failures with Claude"
            echo "  --suite NAME   Run specific test suite"
            echo ""
            echo "Test suites: user-journeys, core-features, security, ui-ux, performance"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check if servers are running
check_servers() {
    local backend_running=false
    local frontend_running=false
    
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        backend_running=true
    fi
    
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        frontend_running=true
    fi
    
    if [ "$backend_running" = false ] || [ "$frontend_running" = false ]; then
        echo -e "${RED}❌ Servers are not running!${NC}"
        echo ""
        echo "Please start servers first with:"
        echo "  ./scripts/start-local-dev.sh"
        echo ""
        echo "Or in separate terminals:"
        echo "  Backend: cd $PROJECT_ROOT && python3 supabase_backend.py"
        echo "  Frontend: cd $FRONTEND_DIR && npm run dev"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Servers are running${NC}"
}

# Run E2E tests
run_tests() {
    cd "$FRONTEND_DIR"
    
    echo -e "${YELLOW}🧪 Running E2E tests...${NC}"
    echo ""
    
    local test_command="npx playwright test"
    
    # Add specific suite if requested
    if [ -n "$TEST_SUITE" ]; then
        case $TEST_SUITE in
            "user-journeys")
                test_command="$test_command tests/e2e/01-user-journeys.spec.ts"
                ;;
            "core-features")
                test_command="$test_command tests/e2e/02-core-features.spec.ts"
                ;;
            "security")
                test_command="$test_command tests/e2e/03-security-features.spec.ts"
                ;;
            "ui-ux")
                test_command="$test_command tests/e2e/04-ui-ux-components.spec.ts"
                ;;
            "performance")
                test_command="$test_command tests/e2e/05-integration-performance.spec.ts"
                ;;
            *)
                echo -e "${RED}Unknown test suite: $TEST_SUITE${NC}"
                exit 1
                ;;
        esac
    fi
    
    # Run tests and capture exit code
    $test_command
    TEST_EXIT_CODE=$?
    
    echo ""
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}✅ All tests passed!${NC}"
    else
        echo -e "${RED}❌ Some tests failed${NC}"
    fi
    
    return $TEST_EXIT_CODE
}

# Open test report
open_report() {
    cd "$FRONTEND_DIR"
    
    echo -e "${BLUE}📊 Opening test report...${NC}"
    
    # Detect OS and use appropriate command
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        npx playwright show-report &
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v xdg-open &> /dev/null; then
            npx playwright show-report &
        else
            echo "Opening report at: http://localhost:9323"
            npx playwright show-report &
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows
        npx playwright show-report &
    else
        echo "Opening report at: http://localhost:9323"
        npx playwright show-report &
    fi
}

# Auto-fix failures with Claude
auto_fix_failures() {
    echo ""
    echo -e "${YELLOW}🤖 Analyzing test failures...${NC}"
    
    # Create a temporary file with test results and context
    local CONTEXT_FILE="$FRONTEND_DIR/test-context.md"
    
    cat > "$CONTEXT_FILE" << EOF
# Test Failure Analysis

## Test Results
$(cd "$FRONTEND_DIR" && npx playwright test --reporter=list 2>&1)

## Failed Test Files
$(find "$FRONTEND_DIR/tests/e2e" -name "*.spec.ts" -exec grep -l "test\|describe" {} \;)

## Recent Changes
$(cd "$PROJECT_ROOT" && git diff --name-only HEAD~5..HEAD 2>/dev/null || echo "No git history")

## Task
Please analyze the test failures above and:
1. Identify the root cause of each failure
2. Suggest specific code fixes
3. Update the test files if needed
4. Ensure all tests pass

Focus on:
- Element selectors that may have changed
- API endpoints that might be different
- Timing issues that need better waits
- Data dependencies between tests
EOF

    # Use Claude to analyze and suggest fixes
    if command -v claude &> /dev/null; then
        echo -e "${BLUE}🔧 Claude is analyzing failures...${NC}"
        
        claude code \
            --include "$FRONTEND_DIR/tests/e2e/*.spec.ts" \
            --include "$FRONTEND_DIR/playwright-report/index.html" \
            --include "$FRONTEND_DIR/src/**/*.{ts,tsx}" \
            --include "$CONTEXT_FILE" \
            --message "Fix all failing E2E tests. Update selectors, add proper waits, and ensure tests are reliable. Show me the exact changes needed."
    else
        echo -e "${YELLOW}⚠️  Claude Code CLI not found${NC}"
        echo "To enable auto-fix, install Claude Code:"
        echo "  npm install -g @anthropic/claude-code"
        echo ""
        echo "Or manually review the test report to fix failures"
    fi
    
    # Clean up
    rm -f "$CONTEXT_FILE"
}

# Main execution
main() {
    echo -e "${BLUE}🔍 Checking environment...${NC}"
    check_servers
    echo ""
    
    # Run tests if requested
    if [ "$RUN_TESTS" = true ]; then
        run_tests
        TEST_RESULT=$?
    else
        TEST_RESULT=1  # Assume failures if not running tests
    fi
    
    # Open report if requested
    if [ "$OPEN_REPORT" = true ]; then
        open_report
    fi
    
    # Auto-fix if requested and tests failed
    if [ "$AUTO_FIX" = true ] && [ $TEST_RESULT -ne 0 ]; then
        auto_fix_failures
    fi
    
    echo ""
    echo "================================================"
    echo -e "${GREEN}✅ Test run complete!${NC}"
    echo "================================================"
    
    if [ $TEST_RESULT -eq 0 ]; then
        echo -e "${GREEN}All tests passed! 🎉${NC}"
    else
        echo -e "${YELLOW}Some tests need attention${NC}"
        if [ "$AUTO_FIX" = false ]; then
            echo ""
            echo "To automatically fix failures, run:"
            echo "  $0 --auto-fix"
        fi
    fi
}

# Run main function
main