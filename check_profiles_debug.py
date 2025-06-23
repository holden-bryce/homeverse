#!/usr/bin/env python3
"""
Debug profile issues
"""
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

print("🔍 Checking Profile Data...")

# Get auth users
try:
    # First check what's in the profiles table
    profiles = supabase.table('profiles').select('*').execute()
    print(f"\n📊 Total profiles: {len(profiles.data)}")
    
    for profile in profiles.data:
        print(f"\nProfile ID: {profile['id']}")
        print(f"  Full Name: {profile.get('full_name', 'N/A')}")
        print(f"  Company ID: {profile.get('company_id', 'N/A')}")
        print(f"  Role: {profile.get('role', 'N/A')}")
        print(f"  Created: {profile.get('created_at', 'N/A')}")
    
    # Check specific test user IDs
    print("\n🔍 Checking specific test user profiles:")
    test_ids = [
        "66b5e28d-8ffc-4b21-8b46-c51aa29d5dd2",  # developer@test.com
        "55c8c24e-05eb-4a1b-b820-02e8b664cfc6"   # applicant@test.com
    ]
    
    for user_id in test_ids:
        profile = supabase.table('profiles').select('*').eq('id', user_id).execute()
        if profile.data:
            print(f"\n✅ Found profile for {user_id}")
            print(f"   Data: {profile.data[0]}")
        else:
            print(f"\n❌ No profile found for {user_id}")
    
    # Check companies
    print("\n🏢 Checking companies:")
    companies = supabase.table('companies').select('*').execute()
    for company in companies.data:
        print(f"\nCompany: {company['name']}")
        print(f"  ID: {company['id']}")
        print(f"  Key: {company['key']}")
        
except Exception as e:
    print(f"❌ Error: {e}")