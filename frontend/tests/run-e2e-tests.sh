#!/bin/bash

# HomeVerse E2E Test Runner Script
# This script runs all end-to-end tests and generates reports

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "HomeVerse E2E Test Suite"
echo "================================================"
echo ""

# Check if servers are running
check_servers() {
    echo "Checking if servers are running..."
    
    # Check backend
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend server is running${NC}"
    else
        echo -e "${RED}✗ Backend server is not running${NC}"
        echo "Please start the backend with: python3 supabase_backend.py"
        exit 1
    fi
    
    # Check frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend server is running${NC}"
    else
        echo -e "${RED}✗ Frontend server is not running${NC}"
        echo "Please start the frontend with: cd frontend && npm run dev"
        exit 1
    fi
    
    echo ""
}

# Run specific test suite
run_test_suite() {
    local suite_name=$1
    local test_file=$2
    
    echo -e "${YELLOW}Running $suite_name...${NC}"
    npx playwright test $test_file --reporter=json --reporter=html
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $suite_name passed${NC}"
        return 0
    else
        echo -e "${RED}✗ $suite_name failed${NC}"
        return 1
    fi
}

# Main test execution
main() {
    check_servers
    
    # Create reports directory
    mkdir -p tests/reports
    
    # Track test results
    total_tests=0
    passed_tests=0
    failed_tests=0
    
    echo "Starting test execution..."
    echo "================================================"
    
    # Run each test suite
    test_suites=(
        "User Journey Tests:01-user-journeys.spec.ts"
        "Core Feature Tests:02-core-features.spec.ts"
        "Security Tests:03-security-features.spec.ts"
        "UI/UX Tests:04-ui-ux-components.spec.ts"
        "Integration & Performance Tests:05-integration-performance.spec.ts"
    )
    
    for suite in "${test_suites[@]}"; do
        IFS=':' read -r name file <<< "$suite"
        ((total_tests++))
        
        if run_test_suite "$name" "tests/e2e/$file"; then
            ((passed_tests++))
        else
            ((failed_tests++))
        fi
        echo ""
    done
    
    # Generate summary report
    echo "================================================"
    echo "Test Execution Summary"
    echo "================================================"
    echo "Total Test Suites: $total_tests"
    echo -e "Passed: ${GREEN}$passed_tests${NC}"
    echo -e "Failed: ${RED}$failed_tests${NC}"
    echo ""
    
    # Generate detailed report
    generate_report
    
    # Exit with appropriate code
    if [ $failed_tests -eq 0 ]; then
        echo -e "${GREEN}All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed. Please check the reports.${NC}"
        exit 1
    fi
}

# Generate HTML report
generate_report() {
    echo "Generating test reports..."
    
    # Copy playwright report
    if [ -d "playwright-report" ]; then
        cp -r playwright-report tests/reports/
    fi
    
    # Generate timestamp
    timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
    
    # Create summary report
    cat > tests/reports/test-summary-$timestamp.json <<EOF
{
    "timestamp": "$timestamp",
    "environment": {
        "backend": "http://localhost:8000",
        "frontend": "http://localhost:3000",
        "node_version": "$(node --version)",
        "os": "$(uname -s)"
    },
    "results": {
        "total_suites": $total_tests,
        "passed_suites": $passed_tests,
        "failed_suites": $failed_tests,
        "success_rate": $(echo "scale=2; $passed_tests * 100 / $total_tests" | bc)%
    }
}
EOF
    
    echo -e "${GREEN}Reports generated in tests/reports/${NC}"
}

# Run specific test suite if argument provided
if [ $# -eq 1 ]; then
    case $1 in
        "user-journeys")
            check_servers
            npx playwright test tests/e2e/01-user-journeys.spec.ts
            ;;
        "core-features")
            check_servers
            npx playwright test tests/e2e/02-core-features.spec.ts
            ;;
        "security")
            check_servers
            npx playwright test tests/e2e/03-security-features.spec.ts
            ;;
        "ui-ux")
            check_servers
            npx playwright test tests/e2e/04-ui-ux-components.spec.ts
            ;;
        "performance")
            check_servers
            npx playwright test tests/e2e/05-integration-performance.spec.ts
            ;;
        "help")
            echo "Usage: $0 [test-suite]"
            echo ""
            echo "Available test suites:"
            echo "  user-journeys  - Run user journey tests"
            echo "  core-features  - Run core feature tests"
            echo "  security       - Run security tests"
            echo "  ui-ux          - Run UI/UX tests"
            echo "  performance    - Run performance tests"
            echo ""
            echo "Run without arguments to execute all tests"
            ;;
        *)
            echo "Unknown test suite: $1"
            echo "Run '$0 help' for usage information"
            exit 1
            ;;
    esac
else
    # Run all tests
    main
fi