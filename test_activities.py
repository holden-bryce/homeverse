#!/usr/bin/env python3
"""Test script to verify activity logging is working"""
import requests
import json
import time

API_BASE = "http://localhost:8000/api/v1"

def test_activities():
    # First login as lender
    print("1. Logging in as lender...")
    login_response = requests.post(f"{API_BASE}/auth/login", json={
        "email": "lender@test.com",
        "password": "password123"
    })
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.text}")
        return
    
    auth_data = login_response.json()
    token = auth_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"✓ Logged in successfully")
    
    # Get activities
    print("\n2. Fetching activities...")
    activities_response = requests.get(f"{API_BASE}/activities", headers=headers)
    
    if activities_response.status_code != 200:
        print(f"Failed to get activities: {activities_response.text}")
        return
    
    activities = activities_response.json()
    print(f"✓ Found {len(activities)} activities")
    
    # Print first few activities
    print("\nRecent activities:")
    for activity in activities[:5]:
        print(f"  - [{activity['type']}] {activity['title']}")
        print(f"    {activity['description']}")
        print(f"    Created: {activity['created_at']}")
        print(f"    Status: {activity.get('status', 'N/A')}")
        print()
    
    # Create a new applicant to generate activity
    print("\n3. Creating new applicant to generate activity...")
    applicant_data = {
        "first_name": "Test",
        "last_name": "Activity",
        "email": f"test.activity.{int(time.time())}@example.com",
        "phone": "(555) 111-2222",
        "household_size": 2,
        "income": 50000
    }
    
    create_response = requests.post(f"{API_BASE}/applicants", json=applicant_data, headers=headers)
    
    if create_response.status_code == 200:
        print("✓ Created applicant successfully")
        
        # Check for new activity
        time.sleep(1)  # Give it a moment
        activities_response = requests.get(f"{API_BASE}/activities?limit=1", headers=headers)
        if activities_response.status_code == 200:
            new_activities = activities_response.json()
            if new_activities and new_activities[0]['type'] == 'applicant':
                print(f"✓ New activity logged: {new_activities[0]['title']}")
    else:
        print(f"Failed to create applicant: {create_response.text}")
    
    # Test activity detail endpoint
    if activities:
        print(f"\n4. Testing activity detail endpoint...")
        activity_id = activities[0]['id']
        detail_response = requests.get(f"{API_BASE}/activities/{activity_id}", headers=headers)
        
        if detail_response.status_code == 200:
            detail = detail_response.json()
            print(f"✓ Got activity detail for: {detail['title']}")
            if detail.get('metadata'):
                print(f"  Metadata: {json.dumps(detail['metadata'], indent=2)}")
        else:
            print(f"Failed to get activity detail: {detail_response.text}")

if __name__ == "__main__":
    print("Testing Activity Logging System")
    print("=" * 50)
    test_activities()
    print("\nTest complete!")