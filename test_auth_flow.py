#!/usr/bin/env python3
"""
Test the authentication flow step by step
"""
import requests
import json
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://localhost:8000"
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

print("🔍 Testing Authentication Flow Step by Step...")

# Step 1: Login
print("\n1. Login as developer@test.com:")
login_data = {"email": "developer@test.com", "password": "password123"}
response = requests.post(f"{BASE_URL}/api/v1/auth/login", json=login_data)
print(f"   Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    token = data["access_token"]
    print(f"   Token received: {token[:20]}...")
    
    # Step 2: Test direct Supabase auth
    print("\n2. Test token with Supabase directly:")
    try:
        user = supabase.auth.get_user(token)
        if user.user:
            print(f"   ✅ Valid token for user: {user.user.email}")
            print(f"   User ID: {user.user.id}")
        else:
            print(f"   ❌ Invalid token")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Step 3: Test protected endpoint
    print("\n3. Test protected endpoint:")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/v1/applicants", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code != 200:
        print(f"   Error: {response.text[:200]}")
    
    # Step 4: Check what query is being made
    print("\n4. Simulate backend profile query:")
    try:
        # First get user from token
        user = supabase.auth.get_user(token)
        if user.user:
            user_id = user.user.id
            print(f"   User ID from token: {user_id}")
            
            # Try the exact query from backend
            profile_result = supabase.table('profiles').select('*, companies(*)').eq('id', user_id).single().execute()
            print(f"   ✅ Profile query successful")
            print(f"   Company: {profile_result.data['companies']['name']}")
        else:
            print(f"   ❌ Could not get user from token")
    except Exception as e:
        print(f"   ❌ Profile query failed: {e}")
        
        # Try without single()
        try:
            profile_result = supabase.table('profiles').select('*, companies(*)').eq('id', user_id).execute()
            print(f"   With execute(): Found {len(profile_result.data)} profiles")
        except Exception as e2:
            print(f"   Also failed with execute(): {e2}")

else:
    print(f"   ❌ Login failed: {response.text}")