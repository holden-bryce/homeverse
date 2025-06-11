#!/usr/bin/env python3
"""Test that auth metadata is properly set for frontend navigation"""

import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BACKEND_URL = "https://homeverse-api.onrender.com"

def test_login_and_profile():
    """Test login and profile loading for each user type"""
    
    test_users = [
        {"email": "admin@test.com", "password": "password123", "expected_role": "admin"},
        {"email": "developer@test.com", "password": "password123", "expected_role": "developer"},
        {"email": "lender@test.com", "password": "password123", "expected_role": "lender"},
        {"email": "buyer@test.com", "password": "password123", "expected_role": "buyer"},
        {"email": "applicant@test.com", "password": "password123", "expected_role": "applicant"}
    ]
    
    print("Testing Authentication and Profile Loading...\n")
    
    for user in test_users:
        print(f"Testing {user['email']}...")
        
        # Login
        login_response = requests.post(
            f"{BACKEND_URL}/api/v1/auth/login",
            json={
                "email": user["email"],
                "password": user["password"]
            }
        )
        
        if login_response.status_code == 200:
            data = login_response.json()
            print(f"  ✅ Login successful")
            print(f"  Token: {data.get('access_token', '')[:20]}...")
            
            # Get profile using the token
            headers = {
                "Authorization": f"Bearer {data['access_token']}"
            }
            
            profile_response = requests.get(
                f"{BACKEND_URL}/api/v1/users/me",
                headers=headers
            )
            
            if profile_response.status_code == 200:
                profile = profile_response.json()
                print(f"  ✅ Profile loaded")
                print(f"  Role: {profile.get('role')} (expected: {user['expected_role']})")
                print(f"  Company ID: {profile.get('company_id')}")
                print(f"  Has metadata: {bool(profile.get('user_metadata'))}")
                
                # Check if role matches
                if profile.get('role') == user['expected_role']:
                    print(f"  ✅ Role matches expected value")
                else:
                    print(f"  ❌ Role mismatch!")
            else:
                print(f"  ❌ Failed to load profile: {profile_response.status_code}")
                print(f"  Error: {profile_response.text}")
        else:
            print(f"  ❌ Login failed: {login_response.status_code}")
            print(f"  Error: {login_response.text}")
        
        print()

if __name__ == "__main__":
    print("="*60)
    print("FRONTEND AUTH METADATA TEST")
    print("="*60)
    print()
    
    test_login_and_profile()
    
    print("\n🎯 Summary:")
    print("- Auth metadata should include role and company_id")
    print("- Frontend navigation will display based on these values")
    print("- Check https://homeverse-frontend.onrender.com after deployment")