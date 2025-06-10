#!/usr/bin/env python3
"""Fix user profiles for existing auth users"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Initialize Supabase with service role key (bypasses RLS)
supabase: Client = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

print("🔧 Fixing user profiles...\n")

# Get all auth users
users_response = supabase.auth.admin.list_users()
print(f"Debug: users_response type: {type(users_response)}")
print(f"Debug: users_response: {users_response}")

# Extract users list properly
if hasattr(users_response, 'users'):
    users_list = users_response.users
elif isinstance(users_response, tuple) and len(users_response) > 0:
    users_list = users_response[0]
elif isinstance(users_response, list):
    users_list = users_response
else:
    print(f"❌ Unexpected users response format: {type(users_response)}")
    users_list = []

# Default company
default_company = supabase.table('companies').select('*').eq('name', 'Demo Company').execute()
if not default_company.data:
    print("❌ No Demo Company found. Please run company setup first.")
    exit(1)

company_id = default_company.data[0]['id']
print(f"✅ Using company: {default_company.data[0]['name']} (ID: {company_id})")

# Role mapping for test users
role_map = {
    'admin@test.com': 'admin',
    'developer@test.com': 'developer', 
    'lender@test.com': 'lender',
    'buyer@test.com': 'buyer',
    'applicant@test.com': 'applicant'
}

print("\n📋 Creating/updating profiles:")

for user in users_list:
    if user.email in role_map:
        # Check if profile exists
        existing = supabase.table('profiles').select('*').eq('id', user.id).execute()
        
        profile_data = {
            'id': user.id,
            'full_name': user.user_metadata.get('full_name', f'{role_map[user.email].title()} User'),
            'role': role_map[user.email],
            'company_id': company_id
        }
        
        if existing.data:
            # Update existing profile
            result = supabase.table('profiles').update(profile_data).eq('id', user.id).execute()
            print(f"✅ Updated profile for {user.email} ({role_map[user.email]})")
        else:
            # Create new profile
            result = supabase.table('profiles').insert(profile_data).execute()
            print(f"✅ Created profile for {user.email} ({role_map[user.email]})")

# Verify profiles
print("\n🔍 Verifying profiles:")
profiles = supabase.from_('profiles').select('*, companies(name)').execute()

# Get auth user emails for display
auth_users = {user.id: user.email for user in users_list}

for profile in profiles.data:
    email = auth_users.get(profile['id'], 'Unknown')
    print(f"  ✅ {email} - {profile['role']} - {profile.get('companies', {}).get('name', 'No company')}")

print("\n✅ Profile setup complete!")
print("\nYou can now login with:")
for email, role in role_map.items():
    print(f"  - {email} / password123 ({role})")