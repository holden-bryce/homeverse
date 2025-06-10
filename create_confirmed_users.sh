#!/bin/bash

# Create confirmed users via Supabase Admin API
SUPABASE_URL="https://vzxadsifonqklotzhdpl.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eGFkc2lmb25xa2xvdHpoZHBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTUwNDQ1MCwiZXhwIjoyMDY1MDgwNDUwfQ.gXduNJebu3W2X1jCYMruxHV5Yq-IOkZ4eGN9gMBAUJ4"

# Get company ID first
COMPANY_ID=$(curl -s "https://vzxadsifonqklotzhdpl.supabase.co/rest/v1/companies?select=id&key=eq.demo-company-2024" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | grep -o '"id":"[^"]*' | sed 's/"id":"//')

echo "Company ID: $COMPANY_ID"

# Users to create
declare -a users=(
  "admin@test.com:admin:Demo Admin"
  "developer@test.com:developer:Demo Developer"
  "lender@test.com:lender:Demo Lender"
  "buyer@test.com:buyer:Demo Buyer"
  "applicant@test.com:applicant:Demo Applicant"
)

echo "🚀 Creating confirmed users..."

for user_info in "${users[@]}"; do
  IFS=':' read -r email role fullname <<< "$user_info"
  
  echo -n "Creating $email... "
  
  # Create user using the /signup endpoint with auto-confirm
  RESPONSE=$(curl -s -X POST \
    "${SUPABASE_URL}/auth/v1/signup" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$email\",
      \"password\": \"password123\",
      \"data\": {
        \"full_name\": \"$fullname\",
        \"role\": \"$role\"
      }
    }")
  
  if echo "$RESPONSE" | grep -q "id"; then
    USER_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | sed 's/"id":"//')
    echo "✅ Created (ID: ${USER_ID:0:8}...)"
    
    # Create profile
    curl -s -X POST \
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
      }" > /dev/null
      
    # Confirm the user
    curl -s -X PUT \
      "${SUPABASE_URL}/auth/v1/admin/users/$USER_ID" \
      -H "apikey: ${SERVICE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_KEY}" \
      -H "Content-Type: application/json" \
      -d '{
        "email_confirm": true
      }' > /dev/null
      
  elif echo "$RESPONSE" | grep -q "already registered"; then
    echo "⚠️  Already exists"
  else
    echo "❌ Failed: $RESPONSE"
  fi
done

echo ""
echo "🔐 Testing admin login..."

# Test login
LOGIN_RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eGFkc2lmb25xa2xvdHpoZHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MDQ0NTAsImV4cCI6MjA2NTA4MDQ1MH0.ZY31NHg6qamLBVeHT5Lo-ud0K_ayPh8DRamK5AUJ6t4" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
  echo "✅ Admin login successful! You can now login."
  echo ""
  echo "🌐 Login at: https://homeverse-frontend.onrender.com"
  echo "📧 Credentials: admin@test.com / password123"
else
  echo "❌ Login test failed, but users might still be created."
  echo "Try logging in manually at: https://homeverse-frontend.onrender.com"
fi