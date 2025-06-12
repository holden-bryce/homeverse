#!/bin/bash

echo "🏠 LOCAL TESTING SETUP SCRIPT"
echo "============================"
echo ""
echo "This script will help you test locally to compare with Render deployment"
echo ""

# Function to test if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "❌ Port $port is already in use"
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

echo "1️⃣ CHECKING PREREQUISITES"
echo "-------------------------"

# Check Python
if command -v python3 &> /dev/null; then
    echo "✅ Python3 found: $(python3 --version)"
else
    echo "❌ Python3 not found"
    exit 1
fi

# Check Node
if command -v node &> /dev/null; then
    echo "✅ Node found: $(node --version)"
else
    echo "❌ Node not found"
    exit 1
fi

# Check ports
echo ""
echo "2️⃣ CHECKING PORTS"
echo "-----------------"
check_port 8000
backend_port_ok=$?
check_port 3000
frontend_port_ok=$?

if [ $backend_port_ok -ne 0 ] || [ $frontend_port_ok -ne 0 ]; then
    echo ""
    echo "⚠️  Some ports are in use. Kill existing processes or use different ports."
    echo ""
fi

echo ""
echo "3️⃣ LOCAL TESTING INSTRUCTIONS"
echo "-----------------------------"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd /mnt/c/Users/12486/homeverse"
echo "  python3 supabase_backend.py"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd /mnt/c/Users/12486/homeverse/frontend"
echo "  npm run dev"
echo ""
echo "4️⃣ TESTING STEPS"
echo "----------------"
echo "1. Open http://localhost:3000/auth/login"
echo "2. Check browser console for:"
echo "   - 'Emergency Login: Form loaded'"
echo "   - 'Emergency Supabase Client: Initializing'"
echo "3. Login with: admin@test.com / password123"
echo "4. Watch console for:"
echo "   - 'Emergency Sign In: Success!'"
echo "   - 'Emergency Dashboard: Starting auth check...'"
echo "5. Should reach dashboard without profile timeout errors"
echo ""
echo "5️⃣ COMPARISON WITH PRODUCTION"
echo "-----------------------------"
echo "✅ If works locally but NOT on Render:"
echo "   → Issue is with Render build process or environment"
echo "   → Check: Build commands, environment variables, Node version"
echo ""
echo "❌ If fails locally too:"
echo "   → Issue is in the code itself"
echo "   → Check: Console errors, network tab, Supabase dashboard"
echo ""
echo "💡 Current production URL: https://homeverse-frontend.onrender.com"
echo ""