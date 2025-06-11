#!/usr/bin/env python3
"""Fix user profiles missing company_id"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

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

def ensure_default_company():
    """Ensure default company exists"""
    print("=== Ensuring Default Company ===")
    try:
        # Check if default company exists
        default_company = supabase.table('companies').select('*').eq('key', 'default-company').execute()
        
        if not default_company.data:
            print("Creating default company...")
            company = supabase.table('companies').insert({
                "name": "Default Company",
                "key": "default-company", 
                "plan": "trial",
                "seats": 100
            }).execute()
            print(f"✅ Created default company: {company.data[0]['id']}")
            return company.data[0]['id']
        else:
            print(f"✅ Default company exists: {default_company.data[0]['id']}")
            return default_company.data[0]['id']
    except Exception as e:
        print(f"❌ Error with default company: {e}")
        return None

def fix_all_profiles():
    """Fix all user profiles that are missing company_id"""
    print("\n=== Fixing All User Profiles ===")
    
    # Get default company ID
    default_company_id = ensure_default_company()
    if not default_company_id:
        print("❌ Can't fix profiles without default company")
        return
    
    try:
        # Get all profiles
        all_profiles = supabase.table('profiles').select('*').execute()
        
        if not all_profiles.data:
            print("No profiles found")
            return
        
        fixed_count = 0
        for profile in all_profiles.data:
            profile_id = profile['id']
            current_company_id = profile.get('company_id')
            
            if not current_company_id:
                print(f"Fixing profile without company_id: {profile['full_name']} ({profile_id})")
                
                # Update profile with default company_id
                update_result = supabase.table('profiles').update({
                    'company_id': default_company_id
                }).eq('id', profile_id).execute()
                
                if update_result.data:
                    print(f"✅ Fixed profile {profile['full_name']}")
                    fixed_count += 1
                else:
                    print(f"❌ Failed to fix profile {profile['full_name']}")
            else:
                print(f"✅ Profile OK: {profile['full_name']} (company_id: {current_company_id})")
        
        print(f"\n✅ Fixed {fixed_count} profiles")
        
    except Exception as e:
        print(f"❌ Error fixing profiles: {e}")

def verify_auth_users_have_profiles():
    """Ensure all auth users have corresponding profiles"""
    print("\n=== Verifying Auth Users Have Profiles ===")
    
    default_company_id = ensure_default_company()
    if not default_company_id:
        return
    
    try:
        # Get all auth users
        auth_users = supabase.auth.admin.list_users()
        
        # Get all profiles
        profiles = supabase.table('profiles').select('id').execute()
        profile_ids = [p['id'] for p in profiles.data] if profiles.data else []
        
        created_count = 0
        for user in auth_users:
            if user.id not in profile_ids:
                print(f"Creating missing profile for user: {user.email}")
                
                # Create profile
                profile_data = {
                    "id": user.id,
                    "company_id": default_company_id,
                    "role": user.user_metadata.get('role', 'buyer'),
                    "full_name": user.user_metadata.get('full_name', user.email.split('@')[0] if user.email else 'User')
                }
                
                result = supabase.table('profiles').insert(profile_data).execute()
                if result.data:
                    print(f"✅ Created profile for {user.email}")
                    created_count += 1
                else:
                    print(f"❌ Failed to create profile for {user.email}")
            else:
                print(f"✅ Profile exists for {user.email}")
        
        print(f"\n✅ Created {created_count} missing profiles")
        
    except Exception as e:
        print(f"❌ Error verifying profiles: {e}")

def show_final_status():
    """Show final status of all profiles"""
    print("\n=== Final Profile Status ===")
    try:
        profiles = supabase.table('profiles').select('*, companies(*)').execute()
        
        if profiles.data:
            print(f"Total profiles: {len(profiles.data)}")
            for profile in profiles.data:
                company_name = profile.get('companies', {}).get('name', 'Unknown') if profile.get('companies') else 'No Company'
                print(f"  - {profile['full_name']} ({profile['role']}) → {company_name}")
        else:
            print("No profiles found")
            
    except Exception as e:
        print(f"❌ Error showing status: {e}")

if __name__ == "__main__":
    print("🔧 Fixing User Profile Company IDs...")
    
    # Fix all issues
    ensure_default_company()
    verify_auth_users_have_profiles()
    fix_all_profiles()
    show_final_status()
    
    print("\n✅ Profile fix complete!")
    print("\nNow test logging in with:")
    print("- developer@test.com / password123")
    print("- lender@test.com / password123") 
    print("- buyer@test.com / password123")
    print("- admin@test.com / password123")