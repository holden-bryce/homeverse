#!/bin/bash

# Supabase configuration
SUPABASE_URL="https://vzxadsifonqklotzhdpl.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eGFkc2lmb25xa2xvdHpoZHBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTUwNDQ1MCwiZXhwIjoyMDY1MDgwNDUwfQ.gXduNJebu3W2X1jCYMruxHV5Yq-IOkZ4eGN9gMBAUJ4"

echo "🔄 Creating admin user via Supabase API..."

# Create admin user
RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123",
    "email_confirm": true,
    "user_metadata": {
      "full_name": "Demo Admin",
      "role": "admin"
    }
  }')

# Check if user was created or already exists
if echo "$RESPONSE" | grep -q "id"; then
  USER_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | sed 's/"id":"//')
  echo "✅ Admin user created successfully! User ID: $USER_ID"
  
  # Get company ID
  COMPANY_RESPONSE=$(curl -s -X GET \
    "${SUPABASE_URL}/rest/v1/companies?key=eq.demo-company-2024" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}")
  
  COMPANY_ID=$(echo "$COMPANY_RESPONSE" | grep -o '"id":"[^"]*' | sed 's/"id":"//' | head -1)
  
  if [ -z "$COMPANY_ID" ]; then
    echo "❌ Demo company not found. Please run the schema SQL first."
  else
    echo "✅ Found demo company: $COMPANY_ID"
    
    # Update profile
    curl -s -X POST \
      "${SUPABASE_URL}/rest/v1/profiles" \
      -H "apikey: ${SERVICE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_KEY}" \
      -H "Content-Type: application/json" \
      -H "Prefer: resolution=merge-duplicates" \
      -d "{
        \"id\": \"$USER_ID\",
        \"company_id\": \"$COMPANY_ID\",
        \"role\": \"admin\",
        \"full_name\": \"Demo Admin\"
      }"
    
    echo "✅ Admin profile updated!"
  fi
  
elif echo "$RESPONSE" | grep -q "already been registered"; then
  echo "⚠️  Admin user already exists!"
else
  echo "❌ Error creating user:"
  echo "$RESPONSE"
fi

echo ""
echo "📧 Login credentials:"
echo "   Email: admin@test.com"
echo "   Password: password123"
echo ""
echo "🌐 Login at: https://homeverse-frontend.onrender.com"