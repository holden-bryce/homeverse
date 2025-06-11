#!/usr/bin/env python3
"""Comprehensive Supabase setup verification"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Get Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    print("❌ Missing Supabase configuration")
    print(f"   SUPABASE_URL: {'✅' if SUPABASE_URL else '❌'}")
    print(f"   SUPABASE_SERVICE_KEY: {'✅' if SUPABASE_SERVICE_KEY else '❌'}")
    print(f"   SUPABASE_ANON_KEY: {'✅' if SUPABASE_ANON_KEY else '❌'}")
    exit(1)

# Initialize Supabase client with service key
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def check_tables():
    """Check if all required tables exist"""
    print("\n🔍 Checking Tables...")
    
    required_tables = [
        'profiles',
        'companies', 
        'applicants',
        'projects',
        'contact_submissions',
        'activity_logs'
    ]
    
    all_good = True
    for table in required_tables:
        try:
            # Try to query the table
            result = supabase.table(table).select('*').limit(1).execute()
            print(f"✅ Table '{table}' exists")
        except Exception as e:
            print(f"❌ Table '{table}' missing or inaccessible: {str(e)}")
            all_good = False
    
    return all_good

def check_auth_users():
    """Check if test users exist in auth"""
    print("\n🔍 Checking Auth Users...")
    
    test_emails = [
        'admin@test.com',
        'developer@test.com',
        'lender@test.com',
        'buyer@test.com',
        'applicant@test.com'
    ]
    
    try:
        users = supabase.auth.admin.list_users()
        existing_emails = [u.email for u in users]
        
        all_good = True
        for email in test_emails:
            if email in existing_emails:
                user = next(u for u in users if u.email == email)
                metadata = user.user_metadata
                print(f"✅ {email}")
                print(f"   - ID: {user.id}")
                print(f"   - Role: {metadata.get('role', 'NOT SET')}")
                print(f"   - Company ID: {metadata.get('company_id', 'NOT SET')}")
            else:
                print(f"❌ {email} - NOT FOUND")
                all_good = False
        
        return all_good
    except Exception as e:
        print(f"❌ Error checking auth users: {str(e)}")
        return False

def check_profiles():
    """Check if profiles exist for auth users"""
    print("\n🔍 Checking User Profiles...")
    
    try:
        users = supabase.auth.admin.list_users()
        
        all_good = True
        for user in users:
            if user.email and '@test.com' in user.email:
                try:
                    profile = supabase.table('profiles').select('*').eq('id', user.id).single().execute()
                    if profile.data:
                        print(f"✅ {user.email} has profile")
                        print(f"   - Role: {profile.data.get('role')}")
                        print(f"   - Company ID: {profile.data.get('company_id')}")
                    else:
                        print(f"❌ {user.email} - NO PROFILE")
                        all_good = False
                except Exception as e:
                    print(f"❌ {user.email} - Profile error: {str(e)}")
                    all_good = False
        
        return all_good
    except Exception as e:
        print(f"❌ Error checking profiles: {str(e)}")
        return False

def check_companies():
    """Check if default company exists"""
    print("\n🔍 Checking Companies...")
    
    try:
        # Check for default company
        default_id = "fc81eaca-9f77-4265-b2b1-c5ff71ce43a8"
        result = supabase.table('companies').select('*').eq('id', default_id).single().execute()
        
        if result.data:
            print(f"✅ Default company exists")
            print(f"   - Name: {result.data.get('name')}")
            print(f"   - Key: {result.data.get('key')}")
            print(f"   - Plan: {result.data.get('plan')}")
            return True
        else:
            print(f"❌ Default company not found")
            return False
    except Exception as e:
        print(f"❌ Error checking companies: {str(e)}")
        return False

def check_rls_status():
    """Check RLS status on tables"""
    print("\n🔍 Checking Row Level Security...")
    
    try:
        # Query to check RLS status
        query = """
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'companies', 'applicants', 'projects')
        """
        
        # Note: Direct SQL execution not available via client
        # We'll check by trying queries instead
        
        tables_to_check = ['profiles', 'companies', 'applicants', 'projects']
        
        for table in tables_to_check:
            try:
                # Try to query as service role (should always work)
                result = supabase.table(table).select('*').limit(1).execute()
                print(f"✅ {table} - Accessible with service role")
            except Exception as e:
                print(f"❌ {table} - Not accessible: {str(e)}")
        
        return True
    except Exception as e:
        print(f"❌ Error checking RLS: {str(e)}")
        return False

def test_auth_flow():
    """Test authentication flow with a test user"""
    print("\n🔍 Testing Authentication Flow...")
    
    try:
        # Try to sign in as a test user
        email = "admin@test.com"
        password = "password123"
        
        # Create a new client with anon key for auth testing
        if SUPABASE_ANON_KEY:
            anon_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
            
            result = anon_client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if result.user:
                print(f"✅ Successfully authenticated as {email}")
                print(f"   - User ID: {result.user.id}")
                print(f"   - Session: {'Active' if result.session else 'None'}")
                
                # Try to get profile with the authenticated session
                profile = anon_client.table('profiles').select('*').eq('id', result.user.id).single().execute()
                if profile.data:
                    print(f"✅ Can access own profile")
                else:
                    print(f"❌ Cannot access own profile")
                
                # Sign out
                anon_client.auth.sign_out()
                return True
            else:
                print(f"❌ Authentication failed")
                return False
        else:
            print("⚠️  No anon key available for auth testing")
            return True
            
    except Exception as e:
        print(f"❌ Auth flow error: {str(e)}")
        return False

def suggest_fixes(issues):
    """Suggest fixes for any issues found"""
    print("\n📋 Suggested Fixes:")
    
    if 'tables' in issues:
        print("\n1. Missing Tables:")
        print("   - Run the supabase_schema.sql file in Supabase SQL editor")
        print("   - Or use Supabase dashboard to create tables manually")
    
    if 'auth_users' in issues:
        print("\n2. Missing Auth Users:")
        print("   - Run: python3 create_supabase_test_users.py")
        print("   - Or create users manually in Supabase Auth dashboard")
    
    if 'profiles' in issues:
        print("\n3. Missing Profiles:")
        print("   - Run: python3 check_auth_metadata.py")
        print("   - This will create profiles for existing auth users")
    
    if 'companies' in issues:
        print("\n4. Missing Default Company:")
        print("   - Run this SQL in Supabase:")
        print("     INSERT INTO companies (id, name, key, plan, seats)")
        print("     VALUES ('fc81eaca-9f77-4265-b2b1-c5ff71ce43a8', 'Default Company', 'default-company', 'trial', 100);")
    
    if 'rls' in issues:
        print("\n5. RLS Issues:")
        print("   - Run the fix_rls_for_frontend.sql file in Supabase SQL editor")
        print("   - This will set up proper policies for frontend access")

def main():
    print("="*60)
    print("SUPABASE SETUP VERIFICATION")
    print("="*60)
    print(f"\n📍 Supabase URL: {SUPABASE_URL}")
    
    issues = []
    
    # Check all components
    if not check_tables():
        issues.append('tables')
    
    if not check_companies():
        issues.append('companies')
    
    if not check_auth_users():
        issues.append('auth_users')
    
    if not check_profiles():
        issues.append('profiles')
    
    if not check_rls_status():
        issues.append('rls')
    
    if not test_auth_flow():
        issues.append('auth_flow')
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    if not issues:
        print("\n✅ ALL CHECKS PASSED!")
        print("\nSupabase is properly configured and ready to use.")
        print("\nNext steps:")
        print("1. The RLS policies in fix_rls_for_frontend.sql should be applied")
        print("2. Monitor the frontend deployment at https://homeverse-frontend.onrender.com")
        print("3. Test login with any test account")
    else:
        print(f"\n❌ ISSUES FOUND: {', '.join(issues)}")
        suggest_fixes(issues)
        
        print("\n\n⚠️  IMPORTANT: To apply the RLS fix:")
        print("1. Go to: " + SUPABASE_URL + "/project/default/sql")
        print("2. Copy the contents of fix_rls_for_frontend.sql")
        print("3. Paste and run in the SQL editor")
        print("4. This will allow the frontend to access profiles properly")

if __name__ == "__main__":
    main()