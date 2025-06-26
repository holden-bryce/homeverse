#!/usr/bin/env python3
"""Debug application update functionality"""

import requests
import json

# Test configuration
API_URL = "http://localhost:8000"

def test_update_with_supabase_token():
    """Test updating application with Supabase token"""
    
    # First, login to get token
    print("1. Testing login...")
    response = requests.post(f"{API_URL}/api/auth/login", json={
        "email": "developer@test.com",
        "password": "password123"
    })
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        print(response.json())
        return
    
    data = response.json()
    token = data.get("access_token")
    print(f"✅ Got token: {token[:20]}...")
    
    # Get applications
    print("\n2. Getting applications...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_URL}/api/v1/applications", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Failed to get applications: {response.status_code}")
        print(response.json())
        return
    
    apps_data = response.json()
    apps = apps_data.get("data", [])
    print(f"✅ Found {len(apps)} applications")
    
    if not apps:
        print("❌ No applications to test with")
        return
    
    # Try to update first application
    app = apps[0]
    app_id = app["id"]
    print(f"\n3. Testing update for application: {app_id}")
    
    update_data = {
        "status": "under_review",
        "developer_notes": "Testing update functionality"
    }
    
    response = requests.patch(
        f"{API_URL}/api/v1/applications/{app_id}",
        headers=headers,
        json=update_data
    )
    
    print(f"Response status: {response.status_code}")
    print(f"Response headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        print("✅ Update successful!")
        print(f"Response: {response.json()}")
    else:
        print(f"❌ Update failed: {response.status_code}")
        try:
            print(f"Error: {response.json()}")
        except:
            print(f"Raw response: {response.text}")

if __name__ == "__main__":
    test_update_with_supabase_token()