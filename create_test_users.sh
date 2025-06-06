#!/bin/bash

# Test users registration script
# First make sure the backend is running on localhost:8000

echo "Creating test users for all portals..."

API_URL="http://localhost:8000"

# Function to register a user
register_user() {
    local email=$1
    local password=$2
    local role=$3
    local company_key=$4
    
    echo "Registering $email with role $role..."
    curl -X POST "$API_URL/api/v1/auth/register" \
        -H "Content-Type: application/json" \
        -H "x-company-key: $company_key" \
        -d "{
            \"email\": \"$email\",
            \"password\": \"$password\",
            \"company_key\": \"$company_key\",
            \"role\": \"$role\"
        }" \
        -w "\nStatus: %{http_code}\n\n"
}

# Register test users
register_user "developer@test.com" "password123" "developer" "test-company"
register_user "lender@test.com" "password123" "lender" "test-company"  
register_user "buyer@test.com" "password123" "buyer" "test-company"
register_user "applicant@test.com" "password123" "applicant" "test-company"
register_user "admin@test.com" "password123" "admin" "test-company"

echo "================================================"
echo "TEST LOGIN CREDENTIALS:"
echo "================================================"
echo "Developer Portal: http://localhost:3000/dashboard/developers"
echo "Email: developer@test.com | Password: password123"
echo ""
echo "Lender Portal: http://localhost:3000/dashboard/lenders" 
echo "Email: lender@test.com | Password: password123"
echo ""
echo "Buyer Portal: http://localhost:3000/dashboard/buyers"
echo "Email: buyer@test.com | Password: password123"
echo ""
echo "Applicant Portal: http://localhost:3000/dashboard/applicants"
echo "Email: applicant@test.com | Password: password123"
echo ""
echo "Admin Portal: http://localhost:3000/dashboard"
echo "Email: admin@test.com | Password: password123"
echo "================================================"