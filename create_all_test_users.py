#!/usr/bin/env python3
"""Create all test users with profiles"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
import time

load_dotenv()

# Initialize Supabase with service role key
supabase: Client = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

print("🚀 Creating all test users...\n")

# Get default company
company = supabase.table('companies').select('*').eq('name', 'Demo Company').execute()
if not company.data:
    print("❌ No Demo Company found")
    sys.exit(1)

company_id = company.data[0]['id']

# Test users to create
test_users = [
    {'email': 'admin@test.com', 'role': 'admin', 'name': 'Admin User'},
    {'email': 'developer@test.com', 'role': 'developer', 'name': 'Developer User'},
    {'email': 'lender@test.com', 'role': 'lender', 'name': 'Lender User'},
    {'email': 'buyer@test.com', 'role': 'buyer', 'name': 'Buyer User'},
    {'email': 'applicant@test.com', 'role': 'applicant', 'name': 'Applicant User'},
]

for user_data in test_users:
    print(f"Creating {user_data['email']}...")
    
    try:
        # Check if user exists
        existing_users = supabase.auth.admin.list_users()
        user_exists = any(u.email == user_data['email'] for u in existing_users)
        
        if user_exists:
            print(f"  ⚠️  User already exists")
            # Get user ID for profile creation
            user_id = next(u.id for u in existing_users if u.email == user_data['email'])
        else:
            # Create user with admin API
            user_response = supabase.auth.admin.create_user({
                'email': user_data['email'],
                'password': 'password123',
                'email_confirm': True,
                'user_metadata': {
                    'full_name': user_data['name'],
                    'role': user_data['role']
                }
            })
            user_id = user_response.user.id
            print(f"  ✅ User created (ID: {user_id[:8]}...)")
        
        # Create or update profile
        existing_profile = supabase.table('profiles').select('*').eq('id', user_id).execute()
        
        profile_data = {
            'id': user_id,
            'full_name': user_data['name'],
            'role': user_data['role'],
            'company_id': company_id
        }
        
        if existing_profile.data:
            supabase.table('profiles').update(profile_data).eq('id', user_id).execute()
            print(f"  ✅ Profile updated")
        else:
            supabase.table('profiles').insert(profile_data).execute()
            print(f"  ✅ Profile created")
            
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
    
    time.sleep(0.5)  # Avoid rate limits

print("\n✅ All test users created!")
print("\nYou can login with:")
for user in test_users:
    print(f"  - {user['email']} / password123 ({user['role']})")

# Test login
print("\n🔐 Testing buyer login...")
try:
    auth = supabase.auth.sign_in_with_password({
        'email': 'buyer@test.com',
        'password': 'password123'
    })
    print("✅ Login successful!")
    supabase.auth.sign_out()
except Exception as e:
    print(f"❌ Login failed: {str(e)}")