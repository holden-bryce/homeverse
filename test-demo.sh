#!/bin/bash

# HomeVerse Test Demo Script
# This script demonstrates how to run the comprehensive E2E tests

echo "====================================="
echo "HomeVerse E2E Test Demo"
echo "====================================="
echo ""
echo "This demo will show you how to run the comprehensive test suite."
echo ""

# Function to display menu
show_menu() {
    echo "Select what you want to test:"
    echo "1) Run all E2E tests"
    echo "2) Run user journey tests only"
    echo "3) Run security tests only"
    echo "4) Run performance tests only"
    echo "5) Open test UI (interactive mode)"
    echo "6) View test reports"
    echo "7) Run manual testing checklist"
    echo "0) Exit"
    echo ""
}

# Function to check if servers are running
check_servers() {
    echo "Checking servers..."
    
    backend_running=false
    frontend_running=false
    
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✓ Backend is running"
        backend_running=true
    else
        echo "✗ Backend is not running"
    fi
    
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✓ Frontend is running"
        frontend_running=true
    else
        echo "✗ Frontend is not running"
    fi
    
    if [ "$backend_running" = false ] || [ "$frontend_running" = false ]; then
        echo ""
        echo "Please start both servers before running tests:"
        echo "  Backend: python3 supabase_backend.py"
        echo "  Frontend: cd frontend && npm run dev"
        echo ""
        return 1
    fi
    
    echo ""
    return 0
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice: " choice
    
    case $choice in
        1)
            echo ""
            echo "Running all E2E tests..."
            if check_servers; then
                cd frontend
                npm run test:e2e
            fi
            ;;
        2)
            echo ""
            echo "Running user journey tests..."
            if check_servers; then
                cd frontend
                npx playwright test tests/e2e/01-user-journeys.spec.ts
            fi
            ;;
        3)
            echo ""
            echo "Running security tests..."
            if check_servers; then
                cd frontend
                npx playwright test tests/e2e/03-security-features.spec.ts
            fi
            ;;
        4)
            echo ""
            echo "Running performance tests..."
            if check_servers; then
                cd frontend
                npx playwright test tests/e2e/05-integration-performance.spec.ts
            fi
            ;;
        5)
            echo ""
            echo "Opening Playwright UI..."
            if check_servers; then
                cd frontend
                npm run test:e2e:ui
            fi
            ;;
        6)
            echo ""
            echo "Opening test reports..."
            cd frontend
            npm run test:e2e:report
            ;;
        7)
            echo ""
            echo "Opening manual testing checklist..."
            if command -v code &> /dev/null; then
                code frontend/tests/MANUAL_TESTING_CHECKLIST.md
            else
                cat frontend/tests/MANUAL_TESTING_CHECKLIST.md | less
            fi
            ;;
        0)
            echo ""
            echo "Exiting test demo..."
            exit 0
            ;;
        *)
            echo ""
            echo "Invalid choice. Please try again."
            ;;
    esac
    
    echo ""
    echo "Press Enter to continue..."
    read
    clear
done