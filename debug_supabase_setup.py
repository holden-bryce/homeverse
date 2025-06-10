"""
Debug and fix Supabase setup for HomeVerse
This script will check and fix common issues with the Supabase setup
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or input("Enter Supabase URL: ")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") or input("Enter Supabase Anon Key: ")

supabase: Client = create_client(url, key)

def check_tables():
    """Check if all required tables exist"""
    print("\n🔍 Checking tables...")
    
    tables = ['companies', 'profiles', 'applicants', 'projects', 'activities', 'contact_submissions']
    
    for table in tables:
        try:
            result = supabase.table(table).select("count", count="exact").limit(1).execute()
            print(f"✅ Table '{table}' exists - Count: {result.count}")
        except Exception as e:
            print(f"❌ Table '{table}' - Error: {str(e)}")

def check_and_create_company():
    """Check if demo company exists and create if not"""
    print("\n🏢 Checking demo company...")
    
    try:
        # Check if demo company exists
        result = supabase.table('companies').select("*").eq('key', 'demo-company-2024').execute()
        
        if result.data:
            print(f"✅ Demo company exists: {result.data[0]}")
            return result.data[0]['id']
        else:
            print("📝 Creating demo company...")
            create_result = supabase.table('companies').insert({
                'name': 'Demo Company',
                'key': 'demo-company-2024',
                'plan': 'trial',
                'seats': 100,
                'settings': {}
            }).execute()
            
            if create_result.data:
                print(f"✅ Demo company created: {create_result.data[0]}")
                return create_result.data[0]['id']
            else:
                print("❌ Failed to create demo company")
                return None
                
    except Exception as e:
        print(f"❌ Error with companies table: {str(e)}")
        return None

def check_user_profiles():
    """Check profiles for test users"""
    print("\n👥 Checking user profiles...")
    
    test_emails = [
        'developer@test.com',
        'lender@test.com', 
        'buyer@test.com',
        'applicant@test.com',
        'admin@test.com'
    ]
    
    try:
        # Get all users from auth
        print("\n📋 Checking authenticated users...")
        
        # Note: This requires service role key to list all users
        # For now, we'll check profiles table
        
        profiles_result = supabase.table('profiles').select("*").execute()
        
        if profiles_result.data:
            print(f"\n✅ Found {len(profiles_result.data)} profiles:")
            for profile in profiles_result.data:
                print(f"  - {profile.get('full_name', 'No name')} ({profile.get('role', 'No role')}) - Company: {profile.get('company_id', 'None')}")
        else:
            print("⚠️  No profiles found in database")
            
    except Exception as e:
        print(f"❌ Error checking profiles: {str(e)}")

def check_rls_status():
    """Check if RLS is enabled on tables"""
    print("\n🔒 Checking RLS status...")
    
    # This requires a direct database connection or admin panel check
    print("ℹ️  RLS status must be checked in Supabase dashboard under:")
    print("   Authentication > Policies")
    print("   Or SQL Editor: SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';")

def test_insert_applicant(company_id):
    """Test inserting an applicant"""
    print("\n🧪 Testing applicant insert...")
    
    if not company_id:
        print("⚠️  No company_id available, skipping test")
        return
        
    test_data = {
        'company_id': company_id,
        'full_name': 'Test Applicant',
        'email': 'test@example.com',
        'phone': '555-0000',
        'income': 50000,
        'household_size': 2,
        'preferences': {'location': 'Test City'},
        'status': 'active'
    }
    
    try:
        result = supabase.table('applicants').insert(test_data).execute()
        if result.data:
            print(f"✅ Test applicant created successfully: {result.data[0]['id']}")
            # Clean up
            supabase.table('applicants').delete().eq('id', result.data[0]['id']).execute()
            print("🧹 Test applicant deleted")
        else:
            print("❌ Failed to create test applicant")
    except Exception as e:
        print(f"❌ Error creating applicant: {str(e)}")

def main():
    print("🏠 HomeVerse Supabase Debug Script")
    print("==================================")
    
    # Run all checks
    check_tables()
    company_id = check_and_create_company()
    check_user_profiles()
    check_rls_status()
    test_insert_applicant(company_id)
    
    print("\n📌 Next Steps:")
    print("1. If tables are missing, run the schema SQL in Supabase SQL Editor")
    print("2. If profiles are missing, users need to be properly created")
    print("3. If RLS is blocking, temporarily disable it for testing")
    print("4. Check browser console for detailed error messages")
    
    print("\n💡 Quick Fix Commands for Supabase SQL Editor:")
    print("-- Disable RLS on all tables (temporary for testing):")
    print("ALTER TABLE companies DISABLE ROW LEVEL SECURITY;")
    print("ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;")
    print("ALTER TABLE applicants DISABLE ROW LEVEL SECURITY;")
    print("ALTER TABLE projects DISABLE ROW LEVEL SECURITY;")
    print("ALTER TABLE activities DISABLE ROW LEVEL SECURITY;")
    print("ALTER TABLE contact_submissions DISABLE ROW LEVEL SECURITY;")

if __name__ == "__main__":
    main()