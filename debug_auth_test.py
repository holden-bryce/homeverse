#!/usr/bin/env python3
"""
Debug authentication issues
"""
import requests
import json

BASE_URL = "http://localhost:8000"

print("🔍 Debugging Authentication...")

# Test login
login_data = {
    "email": "developer@test.com",
    "password": "password123"
}

print(f"\n1. Testing login endpoint:")
try:
    response = requests.post(f"{BASE_URL}/api/v1/auth/login", json=login_data)
    print(f"   Status: {response.status_code}")
    print(f"   Headers: {dict(response.headers)}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Response: {json.dumps(data, indent=2)}")
        token = data.get("access_token")
        
        print(f"\n2. Testing authenticated request:")
        headers = {"Authorization": f"Bearer {token}"}
        me_response = requests.get(f"{BASE_URL}/api/v1/auth/me", headers=headers)
        print(f"   Status: {me_response.status_code}")
        print(f"   Response: {json.dumps(me_response.json(), indent=2)}")
        
        print(f"\n3. Testing applicant creation with token:")
        applicant_data = {
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            "phone": "555-0123",
            "income": 50000,
            "household_size": 1
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/v1/applicants",
            json=applicant_data,
            headers=headers
        )
        print(f"   Status: {create_response.status_code}")
        print(f"   Response: {create_response.text}")
        
    else:
        print(f"   Error: {response.text}")
except Exception as e:
    print(f"   Error: {e}")

print(f"\n4. Checking available endpoints:")
try:
    docs_response = requests.get(f"{BASE_URL}/docs")
    print(f"   API Docs available: {docs_response.status_code == 200}")
except:
    print(f"   Could not access API docs")