#!/bin/bash
# Test HomeVerse functionality with curl

echo "🧪 Testing HomeVerse Functionality"
echo "=================================="

# Start backend in background
echo "Starting backend server..."
python3 supabase_backend.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Test backend health
echo -e "\n✓ Testing backend health..."
curl -s http://localhost:8000/health | jq .

# Test login with developer account
echo -e "\n✓ Testing login (developer@test.com)..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "developer@test.com", "password": "password123"}')

echo "$LOGIN_RESPONSE" | jq .

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r .access_token)

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo "✅ Login successful, got token"
    
    # Test creating an applicant
    echo -e "\n✓ Testing applicant creation..."
    APPLICANT_RESPONSE=$(curl -s -X POST http://localhost:8000/api/applicants \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "first_name": "Test_Curl",
        "last_name": "User_'$(date +%s)'",
        "email": "test_curl_'$(date +%s)'@example.com",
        "phone": "555-0123",
        "address": "123 Test Street",
        "city": "Test City",
        "state": "CA",
        "zip": "90210",
        "annual_income": 50000,
        "household_size": 2,
        "credit_score": 700
      }')
    
    echo "$APPLICANT_RESPONSE" | jq .
    
    # List applicants
    echo -e "\n✓ Testing list applicants..."
    curl -s -X GET http://localhost:8000/api/applicants \
      -H "Authorization: Bearer $TOKEN" | jq '. | length' | xargs -I {} echo "Found {} applicants"
    
    # Test creating a project
    echo -e "\n✓ Testing project creation..."
    PROJECT_RESPONSE=$(curl -s -X POST http://localhost:8000/api/projects \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Test Project Curl '$(date +%s)'",
        "address": "456 Project Ave",
        "city": "Project City",
        "state": "CA",
        "zip": "90211",
        "latitude": 34.0522,
        "longitude": -118.2437,
        "total_units": 100,
        "affordable_units": 30,
        "ami_percentage": 80,
        "status": "planning"
      }')
    
    echo "$PROJECT_RESPONSE" | jq .
    
    # Now test with a different company account
    echo -e "\n✓ Testing login (admin@demo.com)..."
    LOGIN_RESPONSE2=$(curl -s -X POST http://localhost:8000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email": "admin@demo.com", "password": "password123"}')
    
    TOKEN2=$(echo "$LOGIN_RESPONSE2" | jq -r .access_token)
    
    if [ "$TOKEN2" != "null" ] && [ -n "$TOKEN2" ]; then
        echo "✅ Second login successful"
        
        # List applicants for second company
        echo -e "\n✓ Testing data isolation - listing applicants for demo company..."
        DEMO_APPLICANTS=$(curl -s -X GET http://localhost:8000/api/applicants \
          -H "Authorization: Bearer $TOKEN2")
        
        echo "$DEMO_APPLICANTS" | jq '. | length' | xargs -I {} echo "Demo company sees {} applicants"
        
        # Check if demo company can see test company's data
        echo "$DEMO_APPLICANTS" | jq '.[] | select(.first_name | contains("Test_Curl"))' > /tmp/isolation_test.json
        
        if [ -s /tmp/isolation_test.json ]; then
            echo "❌ DATA ISOLATION FAILED - Demo company can see Test company data!"
        else
            echo "✅ DATA ISOLATION WORKING - Demo company cannot see Test company data"
        fi
    fi
else
    echo "❌ Login failed"
fi

# Kill backend
echo -e "\nStopping backend server..."
kill $BACKEND_PID 2>/dev/null

echo -e "\n✅ Test completed"