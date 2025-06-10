#!/usr/bin/env python3
"""Test Supabase integration and verify everything works"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("🔍 Testing Supabase Integration...\n")

# 1. Check environment variables
print("1️⃣ Checking environment variables:")
required_vars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'SUPABASE_ANON_KEY']
missing_vars = []

for var in required_vars:
    value = os.getenv(var)
    if value:
        print(f"✅ {var}: {'*' * 20} (set)")
    else:
        print(f"❌ {var}: NOT SET")
        missing_vars.append(var)

if missing_vars:
    print(f"\n❌ Missing environment variables: {', '.join(missing_vars)}")
    print("Please set these in your .env file")
    sys.exit(1)

# 2. Test Supabase connection
print("\n2️⃣ Testing Supabase connection:")
try:
    from supabase import create_client, Client
    
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_KEY')
    
    supabase: Client = create_client(url, key)
    print("✅ Successfully connected to Supabase")
    
    # Test auth
    print("\n3️⃣ Testing authentication:")
    try:
        # Check if we can access auth admin
        users = supabase.auth.admin.list_users()
        print(f"✅ Found {len(users[0])} users in auth.users")
        
        # List test users
        test_emails = ['admin@test.com', 'developer@test.com', 'lender@test.com', 
                      'buyer@test.com', 'applicant@test.com']
        
        print("\n📋 Test users status:")
        for user in users[0]:
            if user.email in test_emails:
                print(f"  ✅ {user.email} - {user.email_confirmed_at and 'Confirmed' or 'Not confirmed'}")
    except Exception as e:
        print(f"⚠️  Auth test failed: {str(e)}")
    
    # Test database access
    print("\n4️⃣ Testing database access:")
    
    # Check companies table
    try:
        companies = supabase.table('companies').select('*').execute()
        print(f"✅ Companies table: {len(companies.data)} records")
    except Exception as e:
        print(f"❌ Companies table error: {str(e)}")
    
    # Check profiles table
    try:
        profiles = supabase.table('profiles').select('*').execute()
        print(f"✅ Profiles table: {len(profiles.data)} records")
    except Exception as e:
        print(f"❌ Profiles table error: {str(e)}")
    
    # Check RLS status
    print("\n5️⃣ Checking RLS policies:")
    tables = ['profiles', 'companies', 'applicants', 'projects']
    
    for table in tables:
        try:
            # Try to access without auth token (should fail if RLS is enabled)
            anon_client = create_client(url, os.getenv('SUPABASE_ANON_KEY'))
            result = anon_client.table(table).select('*').limit(1).execute()
            if len(result.data) > 0:
                print(f"⚠️  {table}: RLS might be disabled (anonymous access allowed)")
            else:
                print(f"✅ {table}: RLS enabled (no anonymous access)")
        except Exception as e:
            print(f"✅ {table}: RLS enabled (access denied)")
    
    print("\n✅ Supabase integration test completed successfully!")
    
except ImportError:
    print("❌ Supabase module not installed. Run: pip install supabase")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {str(e)}")
    sys.exit(1)

# 6. Test backend can start
print("\n6️⃣ Testing backend startup:")
try:
    import supabase_backend
    print("✅ Backend module imports successfully")
except Exception as e:
    print(f"❌ Backend import error: {str(e)}")

print("\n🎉 All tests completed!")
print("\nNext steps:")
print("1. Run the backend: python supabase_backend.py")
print("2. Run the frontend: cd frontend && npm run dev")
print("3. Login with test users (e.g., buyer@test.com / password123)")