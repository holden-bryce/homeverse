#!/bin/bash

# Create all test users via Supabase Auth Admin API
SUPABASE_URL="https://vzxadsifonqklotzhdpl.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eGFkc2lmb25xa2xvdHpoZHBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTUwNDQ1MCwiZXhwIjoyMDY1MDgwNDUwfQ.gXduNJebu3W2X1jCYMruxHV5Yq-IOkZ4eGN9gMBAUJ4"

# Users to create
declare -a users=(
  "admin@test.com:admin:Demo Admin"
  "developer@test.com:developer:Demo Developer"
  "lender@test.com:lender:Demo Lender"
  "buyer@test.com:buyer:Demo Buyer"
  "applicant@test.com:applicant:Demo Applicant"
)

echo "🚀 Creating all test users..."

for user_info in "${users[@]}"; do
  IFS=':' read -r email role fullname <<< "$user_info"
  
  echo -n "Creating $email ($role)... "
  
  # Create user with invite
  RESPONSE=$(curl -s -X POST \
    "${SUPABASE_URL}/auth/v1/invite" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$email\",
      \"data\": {
        \"full_name\": \"$fullname\",
        \"role\": \"$role\"
      }
    }")
  
  if echo "$RESPONSE" | grep -q "email"; then
    echo "✅ Invited"
    
    # Now set password directly
    USER_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | sed 's/"id":"//')
    
    if [ ! -z "$USER_ID" ]; then
      # Update user password
      curl -s -X PUT \
        "${SUPABASE_URL}/auth/v1/admin/users/$USER_ID" \
        -H "apikey: ${SERVICE_KEY}" \
        -H "Authorization: Bearer ${SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -d '{
          "password": "password123",
          "email_confirm": true
        }' > /dev/null
      
      echo "   Password set to: password123"
    fi
  else
    echo "❌ Failed"
    echo "   Response: $RESPONSE"
  fi
done

echo ""
echo "✅ User creation complete!"
echo ""
echo "📧 Login credentials:"
echo "   admin@test.com / password123"
echo "   developer@test.com / password123"
echo "   lender@test.com / password123"
echo "   buyer@test.com / password123"
echo "   applicant@test.com / password123"