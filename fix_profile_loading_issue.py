#!/usr/bin/env python3
"""Fix profile loading issues by ensuring proper data structure"""

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

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def check_rls_policies():
    """Check if RLS policies might be blocking profile access"""
    print("🔍 Checking RLS policies on profiles table...\n")
    
    try:
        # Check if profiles table has RLS enabled
        result = supabase.rpc('current_setting', {'setting_name': 'row_security'}).execute()
        print(f"Row security setting: {result}")
    except:
        print("Could not check RLS settings")
    
    # Try to list all RLS policies
    try:
        # This query checks policies on the profiles table
        query = """
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'profiles';
        """
        policies = supabase.rpc('get_policies', {'query': query}).execute()
        print(f"RLS Policies: {json.dumps(policies.data, indent=2)}")
    except:
        print("Standard policy check not available")

def create_or_fix_test_profiles():
    """Create or fix profiles for all test users"""
    print("\n🔧 Creating/Fixing Test User Profiles...\n")
    
    # Default company ID
    default_company_id = "fc81eaca-9f77-4265-b2b1-c5ff71ce43a8"
    
    test_users = [
        {
            "id": "40e47137-78fd-4db6-a195-ba3aadc67eda",
            "email": "admin@test.com",
            "role": "admin",
            "full_name": "Admin User"
        },
        {
            "id": "66b5e28d-8ffc-4b21-8b46-c51aa29d5dd2",
            "email": "developer@test.com",
            "role": "developer",
            "full_name": "Developer User"
        },
        {
            "id": "d1c01378-e3d8-48f6-9c8e-6da8487d13e6",
            "email": "lender@test.com",
            "role": "lender",
            "full_name": "Lender User"
        },
        {
            "id": "eab1619c-d2bd-4efa-a8ef-1c87a8ecd027",
            "email": "buyer@test.com",
            "role": "buyer",
            "full_name": "Buyer User"
        },
        {
            "id": "55c8c24e-05eb-4a1b-b820-02e8b664cfc6",
            "email": "applicant@test.com",
            "role": "applicant",
            "full_name": "Applicant User"
        }
    ]
    
    for user in test_users:
        try:
            # First, delete any existing profile to ensure clean state
            supabase.table('profiles').delete().eq('id', user['id']).execute()
            
            # Create new profile with all required fields
            profile_data = {
                "id": user['id'],
                "company_id": default_company_id,
                "role": user['role'],
                "full_name": user['full_name'],
                "phone": None,
                "timezone": "UTC",
                "language": "en",
                "notification_preferences": {}
            }
            
            result = supabase.table('profiles').insert(profile_data).execute()
            print(f"✅ Created profile for {user['email']}")
            
            # Verify it can be read back
            verify = supabase.table('profiles').select('*, companies(*)').eq('id', user['id']).single().execute()
            if verify.data:
                print(f"   ✓ Verified: {verify.data['full_name']} - {verify.data.get('companies', {}).get('name', 'N/A')}")
            else:
                print(f"   ❌ Could not verify profile!")
                
        except Exception as e:
            print(f"❌ Error with {user['email']}: {e}")

def test_profile_queries():
    """Test the exact queries the frontend uses"""
    print("\n🧪 Testing Frontend Profile Queries...\n")
    
    # Test admin user specifically
    admin_id = "40e47137-78fd-4db6-a195-ba3aadc67eda"
    
    try:
        # Test 1: Basic profile query
        print("Test 1: Basic profile select")
        result = supabase.table('profiles').select('*').eq('id', admin_id).execute()
        print(f"Result: {json.dumps(result.data, indent=2) if result.data else 'No data'}")
        
        # Test 2: Profile with company join (what frontend uses)
        print("\nTest 2: Profile with company join")
        result = supabase.table('profiles').select('*, companies(*)').eq('id', admin_id).single().execute()
        print(f"Result: {json.dumps(result.data, indent=2) if result.data else 'No data'}")
        
        # Test 3: Check if anon key can access
        if os.getenv("SUPABASE_ANON_KEY"):
            print("\nTest 3: Testing with anon key")
            anon_client = create_client(SUPABASE_URL, os.getenv("SUPABASE_ANON_KEY"))
            result = anon_client.table('profiles').select('*, companies(*)').eq('id', admin_id).single().execute()
            print(f"Anon key result: {json.dumps(result.data, indent=2) if result.data else 'No data'}")
        
    except Exception as e:
        print(f"❌ Query test failed: {e}")
        import traceback
        traceback.print_exc()

def disable_rls_temporarily():
    """Temporarily disable RLS on profiles table for testing"""
    print("\n⚠️  Disabling RLS on profiles table...\n")
    
    try:
        # This requires admin privileges
        result = supabase.rpc('exec_sql', {
            'query': 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;'
        }).execute()
        print("✅ RLS disabled on profiles table")
    except:
        print("❌ Could not disable RLS (this requires special permissions)")
        print("   You may need to do this in Supabase dashboard")

if __name__ == "__main__":
    print("="*60)
    print("FIXING PROFILE LOADING ISSUES")
    print("="*60)
    
    # Check current state
    check_rls_policies()
    
    # Fix profiles
    create_or_fix_test_profiles()
    
    # Test queries
    test_profile_queries()
    
    print("\n" + "="*60)
    print("💡 RECOMMENDATIONS:")
    print("="*60)
    print("\n1. If profiles are still not loading, check Supabase dashboard:")
    print("   - Go to Authentication > Policies")
    print("   - Check if profiles table has restrictive RLS policies")
    print("   - Consider temporarily disabling RLS on profiles table")
    print("\n2. Clear browser data completely:")
    print("   - Clear all cookies and localStorage")
    print("   - Use incognito mode for testing")
    print("\n3. Check Supabase logs:")
    print("   - Go to Supabase dashboard > Logs > API")
    print("   - Look for any query errors")
    print("\n4. The issue might be CORS or network related")
    print("   - Check browser console for CORS errors")
    print("   - Verify Supabase URL is accessible")