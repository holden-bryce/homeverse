#!/usr/bin/env python3
"""
Test applicant creation functionality locally
"""

import requests
import json
from datetime import datetime

# First, we need to login to get a token
def get_auth_token():
    """Login and get auth token"""
    login_data = {
        "email": "admin@test.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/auth/login",
            json=login_data
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get('access_token')
    except:
        pass
    
    return None

def test_create_applicant(token=None):
    """Test creating a new applicant"""
    
    print("🧑 TESTING APPLICANT CREATION")
    print("=" * 40)
    
    # Test applicant data
    applicant_data = {
        "first_name": "Test",
        "last_name": "Applicant",
        "email": "test.applicant@example.com",
        "phone": "555-0123",
        "household_size": 3,
        "income": 45000,
        "ami_percent": 60,
        "location_preference": "Downtown",
        "latitude": 40.7128,
        "longitude": -74.0060
    }
    
    print(f"Creating applicant: {applicant_data['first_name']} {applicant_data['last_name']}")
    
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    try:
        # Try the Supabase backend endpoint
        response = requests.post(
            "http://localhost:8000/api/v1/applicants",
            json=applicant_data,
            headers=headers,
            timeout=10
        )
        
        print(f"\nResponse Status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            data = response.json()
            print("✅ Applicant created successfully!")
            print(f"   ID: {data.get('id')}")
            print(f"   Name: {data.get('first_name')} {data.get('last_name')}")
            print(f"   Email: {data.get('email')}")
            return data.get('id')
        else:
            print(f"❌ Failed to create applicant: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        
    return None

def test_list_applicants(token=None):
    """Test listing applicants"""
    
    print("\n📋 TESTING APPLICANT LIST")
    print("=" * 40)
    
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    try:
        response = requests.get(
            "http://localhost:8000/api/v1/applicants",
            headers=headers,
            timeout=10
        )
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {len(data)} applicants")
            
            for applicant in data[:3]:  # Show first 3
                print(f"   - {applicant.get('first_name')} {applicant.get('last_name')} ({applicant.get('email')})")
                
        else:
            print(f"❌ Failed to list applicants: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_applicant_in_supabase():
    """Check if we can verify the applicant in Supabase directly"""
    
    print("\n🔍 CHECKING SUPABASE DIRECTLY")
    print("=" * 40)
    
    try:
        # Import supabase client
        from supabase import create_client, Client
        import os
        
        # Get Supabase credentials from environment
        url = os.getenv('NEXT_PUBLIC_SUPABASE_URL', 'https://vzxadsifonqklotzhdpl.supabase.co')
        key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
        
        if not key:
            print("❌ Supabase key not found in environment")
            return
            
        print(f"Supabase URL: {url}")
        
        # Create client
        supabase: Client = create_client(url, key)
        
        # Query applicants table
        result = supabase.table('applicants').select('*').limit(5).execute()
        
        if result.data:
            print(f"✅ Found {len(result.data)} applicants in Supabase")
            for app in result.data:
                print(f"   - {app.get('first_name')} {app.get('last_name')}")
        else:
            print("⚠️ No applicants found in Supabase")
            
    except Exception as e:
        print(f"❌ Supabase error: {e}")

def main():
    """Run all tests"""
    
    print("🏠 LOCAL APPLICANT FUNCTIONALITY TEST")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # Get auth token
    print("🔐 Getting auth token...")
    token = get_auth_token()
    
    if token:
        print("✅ Got auth token")
    else:
        print("⚠️ No auth token - will try without authentication")
    
    # Test applicant operations
    applicant_id = test_create_applicant(token)
    test_list_applicants(token)
    test_applicant_in_supabase()
    
    print("\n" + "=" * 50)
    print("📝 SUMMARY")
    print("\nTo test in the UI:")
    print("1. Go to: http://localhost:3000/dashboard/applicants")
    print("2. Click 'Add New Applicant' button")
    print("3. Fill out the form")
    print("4. Click 'Save Applicant'")
    print("5. Check browser console for any errors")
    print("\nIf you see 'Profile query timeout' errors:")
    print("- The form is trying to load profile data")
    print("- This is the same issue we fixed in login")
    print("- May need to create emergency version of applicant form")

if __name__ == "__main__":
    main()