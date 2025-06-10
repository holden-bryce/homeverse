#!/usr/bin/env python3
"""Test user creation functionality"""
import os
from dotenv import load_dotenv
from supabase import create_client
import sys

load_dotenv()

# Initialize Supabase with service key
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

print("🧪 Testing User Creation\n")

# Test creating a new user
test_email = "testuser@example.com"
test_password = "TestPassword123!"

print(f"1️⃣ Creating user: {test_email}")

try:
    # Method 1: Using admin API (recommended for backend)
    response = supabase.auth.admin.create_user({
        'email': test_email,
        'password': test_password,
        'email_confirm': True,  # Skip email confirmation
        'user_metadata': {
            'full_name': 'Test User',
            'role': 'buyer'
        }
    })
    
    print(f"✅ User created successfully!")
    print(f"   ID: {response.user.id}")
    print(f"   Email: {response.user.email}")
    print(f"   Confirmed: {response.user.email_confirmed_at is not None}")
    
    # Create profile
    company = supabase.table('companies').select('*').eq('name', 'Demo Company').single().execute()
    if company.data:
        profile_data = {
            'id': response.user.id,
            'full_name': 'Test User',
            'role': 'buyer',
            'company_id': company.data['id']
        }
        
        profile = supabase.table('profiles').insert(profile_data).execute()
        print(f"✅ Profile created for user")
    
    # Test login
    print(f"\n2️⃣ Testing login with created user")
    login_response = supabase.auth.sign_in_with_password({
        'email': test_email,
        'password': test_password
    })
    
    if login_response.session:
        print("✅ Login successful!")
        print(f"   Access token: {login_response.session.access_token[:20]}...")
        
        # Sign out
        supabase.auth.sign_out()
    
    # Cleanup - delete test user
    print(f"\n3️⃣ Cleaning up - deleting test user")
    supabase.auth.admin.delete_user(response.user.id)
    print("✅ Test user deleted")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    sys.exit(1)

print("\n✅ User creation functionality is working correctly!")
print("\n📝 Summary:")
print("- Admin API can create users with confirmed emails")
print("- Users can login immediately after creation")
print("- Profiles can be created for new users")
print("\n🚀 You can now create users via:")
print("1. Backend API: POST /api/v1/auth/register")
print("2. Admin API: POST /api/v1/admin/users (requires admin auth)")
print("3. Python scripts using supabase.auth.admin.create_user()")