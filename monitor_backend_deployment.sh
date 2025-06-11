#!/bin/bash
# Monitor backend deployment status

echo "🔍 Monitoring HomeVerse Backend Deployment"
echo "Checking every 30 seconds for Supabase backend..."
echo "Press Ctrl+C to stop"
echo ""

while true; do
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    response=$(curl -s https://homeverse-api.onrender.com/)
    
    if echo "$response" | grep -q "Supabase"; then
        echo "✅ [$timestamp] Supabase backend is LIVE!"
        echo "$response" | python3 -m json.tool
        break
    else
        echo "⏳ [$timestamp] Still running old backend (SQLite)"
        echo "   Current: $(echo "$response" | grep -o '"message":"[^"]*"' | head -1)"
    fi
    
    sleep 30
done

echo ""
echo "🎉 Deployment complete! New backend is running."
echo "Next steps:"
echo "1. Ensure Supabase environment variables are set in Render"
echo "2. Test authentication at https://homeverse-frontend.onrender.com"