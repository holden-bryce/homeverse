#!/bin/bash

# Set up profiles for all created users
SUPABASE_URL="https://vzxadsifonqklotzhdpl.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eGFkc2lmb25xa2xvdHpoZHBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTUwNDQ1MCwiZXhwIjoyMDY1MDgwNDUwfQ.gXduNJebu3W2X1jCYMruxHV5Yq-IOkZ4eGN9gMBAUJ4"

echo "🔄 Setting up user profiles..."

# First get the demo company ID
COMPANY_RESPONSE=$(curl -s "https://vzxadsifonqklotzhdpl.supabase.co/rest/v1/companies?select=id&key=eq.demo-company-2024" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}")

COMPANY_ID=$(echo "$COMPANY_RESPONSE" | grep -o '"id":"[^"]*' | sed 's/"id":"//')

if [ -z "$COMPANY_ID" ]; then
  echo "❌ Demo company not found!"
  exit 1
fi

echo "✅ Found demo company: $COMPANY_ID"

# Get all test users
USERS_RESPONSE=$(curl -s "https://vzxadsifonqklotzhdpl.supabase.co/auth/v1/admin/users" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}")

# Process each test user
declare -a users=(
  "admin@test.com:admin:Demo Admin"
  "developer@test.com:developer:Demo Developer"
  "lender@test.com:lender:Demo Lender"
  "buyer@test.com:buyer:Demo Buyer"
  "applicant@test.com:applicant:Demo Applicant"
)

for user_info in "${users[@]}"; do
  IFS=':' read -r email role fullname <<< "$user_info"
  
  echo -n "Setting up profile for $email... "
  
  # Extract user ID for this email
  USER_ID=$(echo "$USERS_RESPONSE" | grep -B5 -A5 "\"$email\"" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
  
  if [ ! -z "$USER_ID" ]; then
    # Create/update profile
    PROFILE_RESPONSE=$(curl -s -X POST \
      "${SUPABASE_URL}/rest/v1/profiles" \
      -H "apikey: ${SERVICE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_KEY}" \
      -H "Content-Type: application/json" \
      -H "Prefer: resolution=merge-duplicates" \
      -d "{
        \"id\": \"$USER_ID\",
        \"company_id\": \"$COMPANY_ID\",
        \"role\": \"$role\",
        \"full_name\": \"$fullname\"
      }")
    
    if echo "$PROFILE_RESPONSE" | grep -q "error"; then
      echo "❌ Failed: $PROFILE_RESPONSE"
    else
      echo "✅ Done"
    fi
  else
    echo "❌ User ID not found"
  fi
done

echo ""
echo "✅ Profile setup complete!"
echo ""
echo "Testing login for admin user..."

# Test admin login
LOGIN_RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eGFkc2lmb25xa2xvdHpoZHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MDQ0NTAsImV4cCI6MjA2NTA4MDQ1MH0.ZY31NHg6qamLBVeHT5Lo-ud0K_ayPh8DRamK5AUJ6t4" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
  echo "✅ Admin login successful!"
else
  echo "❌ Admin login failed: $LOGIN_RESPONSE"
fi