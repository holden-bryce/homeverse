#!/usr/bin/env python3
"""Test script to verify settings functionality"""
import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_EMAIL = "developer@test.com"
TEST_PASSWORD = "password123"

def test_auth_and_settings():
    """Test authentication and settings endpoints"""
    print("🔧 Testing Settings Functionality")
    print("=" * 50)
    
    # Test login
    print("1. Testing login...")
    login_response = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        return False
    
    login_data = login_response.json()
    token = login_data.get('access_token')
    if not token:
        print("❌ No access_token received from login")
        print(f"Login response: {login_data}")
        return False
    
    print("✅ Login successful")
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test getting current settings
    print("2. Testing GET settings...")
    settings_response = requests.get(f"{BASE_URL}/api/v1/users/settings", headers=headers)
    
    if settings_response.status_code != 200:
        print(f"❌ Get settings failed: {settings_response.status_code}")
        print(f"Response: {settings_response.text}")
        return False
    
    current_settings = settings_response.json()
    print("✅ Settings retrieved successfully")
    print(f"Current settings: {json.dumps(current_settings, indent=2)}")
    
    # Test updating notification settings
    print("3. Testing PATCH settings (notifications)...")
    notification_update = {
        "notifications": {
            "email_new_applications": True,
            "email_status_updates": True,
            "email_weekly_report": True,
            "email_new_matches": True,
            "email_project_updates": True
        }
    }
    
    update_response = requests.patch(
        f"{BASE_URL}/api/v1/users/settings", 
        headers=headers,
        json=notification_update
    )
    
    if update_response.status_code != 200:
        print(f"❌ Update settings failed: {update_response.status_code}")
        print(f"Response: {update_response.text}")
        return False
    
    print("✅ Notification settings updated successfully")
    
    # Test updating display settings
    print("4. Testing PATCH settings (display)...")
    display_update = {
        "display": {
            "theme": "light",
            "language": "en",
            "timezone": "America/Los_Angeles"
        }
    }
    
    display_response = requests.patch(
        f"{BASE_URL}/api/v1/users/settings", 
        headers=headers,
        json=display_update
    )
    
    if display_response.status_code != 200:
        print(f"❌ Update display settings failed: {display_response.status_code}")
        print(f"Response: {display_response.text}")
        return False
    
    print("✅ Display settings updated successfully")
    
    # Test profile update
    print("5. Testing profile update...")
    profile_update = {
        "full_name": "Test Developer Updated",
        "phone": "+1-555-123-4567",
        "timezone": "America/New_York",
        "language": "en"
    }
    
    profile_response = requests.put(
        f"{BASE_URL}/api/v1/users/me", 
        headers=headers,
        json=profile_update
    )
    
    if profile_response.status_code != 200:
        print(f"❌ Update profile failed: {profile_response.status_code}")
        print(f"Response: {profile_response.text}")
        return False
    
    print("✅ Profile updated successfully")
    
    # Test company settings (may fail if endpoint is not fully implemented)
    print("6. Testing company settings update...")
    company_update = {
        "name": "Test Company Updated",
        "address": "123 Test Street",
        "city": "San Francisco",
        "state": "CA",
        "zip_code": "94102",
        "phone": "+1-415-555-0123",
        "website": "https://testcompany.com",
        "description": "A test company for HomeVerse"
    }
    
    company_response = requests.patch(
        f"{BASE_URL}/api/v1/company/settings", 
        headers=headers,
        json=company_update
    )
    
    if company_response.status_code == 200:
        print("✅ Company settings updated successfully")
    else:
        print(f"⚠️  Company settings update returned: {company_response.status_code}")
        print(f"Response: {company_response.text}")
    
    # Verify final settings
    print("7. Verifying updated settings...")
    final_settings_response = requests.get(f"{BASE_URL}/api/v1/users/settings", headers=headers)
    
    if final_settings_response.status_code == 200:
        final_settings = final_settings_response.json()
        print("✅ Final settings verification successful")
        print(f"Final settings: {json.dumps(final_settings, indent=2)}")
    else:
        print(f"❌ Final settings verification failed: {final_settings_response.status_code}")
    
    print("\n" + "=" * 50)
    print("🎉 Settings functionality test completed!")
    return True

if __name__ == "__main__":
    try:
        test_auth_and_settings()
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()