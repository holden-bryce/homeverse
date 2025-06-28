#!/usr/bin/env python3
"""Test application update functionality against production API"""

import requests
import json
import time

# Production API URL
API_URL = "https://homeverse-api.onrender.com"

def test_update_application():
    """Test updating application status in production"""
    
    print("1. Testing login...")
    # Login as developer
    response = requests.post(f"{API_URL}/api/auth/login", json={
        "email": "developer@test.com",
        "password": "password123"
    })
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)
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
        print(response.text)
        return
    
    apps_data = response.json()
    apps = apps_data.get("data", [])
    print(f"✅ Found {len(apps)} applications")
    
    if not apps:
        print("❌ No applications to test with")
        return
    
    # Find a pending application
    pending_app = None
    for app in apps:
        if app.get("status") == "pending":
            pending_app = app
            break
    
    if not pending_app:
        # Use first application
        pending_app = apps[0]
    
    app_id = pending_app["id"]
    print(f"\n3. Testing update for application: {app_id}")
    print(f"   Current status: {pending_app.get('status')}")
    
    # Try to update status
    update_data = {
        "status": "under_review",
        "developer_notes": "Testing application update functionality"
    }
    
    print(f"\n4. Sending PATCH request...")
    response = requests.patch(
        f"{API_URL}/api/v1/applications/{app_id}",
        headers=headers,
        json=update_data
    )
    
    print(f"Response status: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Update successful!")
        result = response.json()
        print(f"Updated status: {result.get('status')}")
    else:
        print(f"❌ Update failed: {response.status_code}")
        try:
            error_data = response.json()
            print(f"Error: {error_data}")
        except:
            print(f"Raw response: {response.text}")
    
    # Verify the update
    print("\n5. Verifying update...")
    time.sleep(1)
    response = requests.get(f"{API_URL}/api/v1/applications", headers=headers)
    
    if response.status_code == 200:
        apps_data = response.json()
        apps = apps_data.get("data", [])
        
        for app in apps:
            if app["id"] == app_id:
                print(f"✅ Verified - Application status is now: {app.get('status')}")
                if app.get('developer_notes'):
                    print(f"   Developer notes: {app.get('developer_notes')}")
                break

if __name__ == "__main__":
    test_update_application()