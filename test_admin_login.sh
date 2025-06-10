#!/bin/bash

# Test admin login via Supabase Auth API
SUPABASE_URL="https://vzxadsifonqklotzhdpl.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eGFkc2lmb25xa2xvdHpoZHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MDQ0NTAsImV4cCI6MjA2NTA4MDQ1MH0.ZY31NHg6qamLBVeHT5Lo-ud0K_ayPh8DRamK5AUJ6t4"

echo "🔐 Testing admin login..."

RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123"
  }')

if echo "$RESPONSE" | grep -q "access_token"; then
  echo "✅ Admin login successful!"
  echo "The admin user exists and can authenticate."
else
  echo "❌ Admin login failed"
  echo "Response: $RESPONSE"
fi