#!/usr/bin/env python3
"""
Create test applicants for debugging
"""
import requests
import json

BASE_URL = "http://localhost:8000"

# First, login as developer
login_data = {"email": "developer@test.com", "password": "password123"}
response = requests.post(f"{BASE_URL}/api/v1/auth/login", json=login_data)

if response.status_code == 200:
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("✅ Logged in as developer@test.com")
    
    # Create test applicants
    applicants = [
        {
            "full_name": "John Doe",
            "email": "john.doe@test.com",
            "phone": "555-0101",
            "income": 45000,
            "household_size": 3,
            "address": "123 Main St",
            "city": "Austin",
            "state": "TX",
            "zip_code": "78701",
            "latitude": 30.2672,
            "longitude": -97.7431
        },
        {
            "full_name": "Jane Smith",
            "email": "jane.smith@test.com",
            "phone": "555-0102",
            "income": 35000,
            "household_size": 2,
            "address": "456 Oak Ave",
            "city": "Austin",
            "state": "TX",
            "zip_code": "78702",
            "latitude": 30.2572,
            "longitude": -97.7331
        },
        {
            "full_name": "Robert Johnson",
            "email": "robert.j@test.com",
            "phone": "555-0103",
            "income": 55000,
            "household_size": 4,
            "address": "789 Pine Rd",
            "city": "Austin",
            "state": "TX",
            "zip_code": "78703",
            "latitude": 30.2772,
            "longitude": -97.7531
        }
    ]
    
    for applicant in applicants:
        response = requests.post(f"{BASE_URL}/api/v1/applicants", 
                               headers=headers, 
                               json=applicant)
        if response.status_code in [200, 201]:
            print(f"✅ Created applicant: {applicant['full_name']}")
        else:
            print(f"❌ Failed to create {applicant['full_name']}: {response.status_code}")
            print(f"   Error: {response.text[:200]}")
    
    # Check how many applicants we have now
    response = requests.get(f"{BASE_URL}/api/v1/applicants", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"\n📊 Total applicants in system: {len(data['data'])}")
    else:
        print(f"\n❌ Could not fetch applicants: {response.status_code}")
else:
    print(f"❌ Login failed: {response.status_code}")
    print(response.text)