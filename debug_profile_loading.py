#!/usr/bin/env python3
"""Debug profile loading issue for admin@test.com"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Get Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    print("❌ Missing Supabase configuration")
    exit(1)

# Initialize Supabase client with service key for admin access
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def debug_admin_user():
    """Debug the admin@test.com user specifically"""
    print("🔍 Debugging admin@test.com profile loading issue...\n")
    
    admin_id = "40e47137-78fd-4db6-a195-ba3aadc67eda"
    
    try:
        # 1. Check if profile exists
        print("1. Checking if profile exists...")
        profile_basic = supabase.table('profiles').select('*').eq('id', admin_id).execute()
        if profile_basic.data:
            print(f"✅ Profile found: {json.dumps(profile_basic.data[0], indent=2)}")
        else:
            print("❌ No profile found!")
            return
        
        # 2. Check if company exists
        print("\n2. Checking company data...")
        company_id = profile_basic.data[0].get('company_id')
        if company_id:
            company = supabase.table('companies').select('*').eq('id', company_id).execute()
            if company.data:
                print(f"✅ Company found: {json.dumps(company.data[0], indent=2)}")
            else:
                print(f"❌ Company not found for ID: {company_id}")
        else:
            print("❌ No company_id in profile!")
        
        # 3. Try the join query that frontend uses
        print("\n3. Testing profile with company join...")
        profile_with_company = supabase.table('profiles').select('*, companies(*)').eq('id', admin_id).single().execute()
        if profile_with_company.data:
            print(f"✅ Profile with company join successful")
            print(f"Company data in response: {profile_with_company.data.get('companies')}")
        else:
            print("❌ Profile with company join failed!")
            
        # 4. Check RLS policies
        print("\n4. Checking if RLS might be blocking...")
        # Try with anon key to see if RLS is an issue
        if os.getenv("SUPABASE_ANON_KEY"):
            anon_client = create_client(SUPABASE_URL, os.getenv("SUPABASE_ANON_KEY"))
            anon_result = anon_client.table('profiles').select('*').eq('id', admin_id).execute()
            if anon_result.data:
                print("⚠️ Profile accessible with anon key (RLS allows public read)")
            else:
                print("ℹ️ Profile not accessible with anon key (RLS restricts access)")
                
    except Exception as e:
        print(f"❌ Error during debug: {e}")
        import traceback
        traceback.print_exc()

def check_all_test_users():
    """Check all test users for profile issues"""
    print("\n\n📋 Checking all test users...\n")
    
    test_users = [
        {"email": "developer@test.com", "id": "66b5e28d-8ffc-4b21-8b46-c51aa29d5dd2"},
        {"email": "lender@test.com", "id": "d1c01378-e3d8-48f6-9c8e-6da8487d13e6"},
        {"email": "buyer@test.com", "id": "eab1619c-d2bd-4efa-a8ef-1c87a8ecd027"},
        {"email": "admin@test.com", "id": "40e47137-78fd-4db6-a195-ba3aadc67eda"},
        {"email": "applicant@test.com", "id": "55c8c24e-05eb-4a1b-b820-02e8b664cfc6"}
    ]
    
    for user in test_users:
        try:
            result = supabase.table('profiles').select('*, companies(*)').eq('id', user['id']).single().execute()
            if result.data and result.data.get('companies'):
                print(f"✅ {user['email']}: Profile OK, Company: {result.data['companies']['name']}")
            else:
                print(f"❌ {user['email']}: Missing profile or company data")
        except Exception as e:
            print(f"❌ {user['email']}: Error - {str(e)}")

def test_simple_queries():
    """Test simple queries to isolate the issue"""
    print("\n\n🧪 Testing simple queries...\n")
    
    try:
        # Test 1: Simple count
        count_result = supabase.table('profiles').select('*', count='exact').execute()
        print(f"Total profiles: {count_result.count}")
        
        # Test 2: List profiles without join
        profiles = supabase.table('profiles').select('id, full_name, role').limit(5).execute()
        print(f"Simple profile query works: {len(profiles.data)} profiles fetched")
        
        # Test 3: List companies
        companies = supabase.table('companies').select('id, name').execute()
        print(f"Companies in database: {len(companies.data)}")
        
    except Exception as e:
        print(f"❌ Simple query failed: {e}")

if __name__ == "__main__":
    debug_admin_user()
    check_all_test_users()
    test_simple_queries()
    
    print("\n\n💡 Recommendations:")
    print("1. Check if Supabase RLS policies are blocking the query")
    print("2. Verify the frontend is using the correct auth token")
    print("3. Check browser console for CORS or network errors")
    print("4. Try clearing browser cache and cookies")