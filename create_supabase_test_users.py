#!/usr/bin/env python3
"""Create test users in Supabase using the Admin API"""
import os
from supabase import create_client, Client
import asyncio

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    print("❌ Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables")
    exit(1)

# Initialize Supabase admin client
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Test users to create
TEST_USERS = [
    {
        "email": "developer@test.com",
        "password": "password123",
        "metadata": {
            "full_name": "Demo Developer",
            "role": "developer"
        }
    },
    {
        "email": "lender@test.com",
        "password": "password123",
        "metadata": {
            "full_name": "Demo Lender",
            "role": "lender"
        }
    },
    {
        "email": "buyer@test.com",
        "password": "password123",
        "metadata": {
            "full_name": "Demo Buyer",
            "role": "buyer"
        }
    },
    {
        "email": "applicant@test.com",
        "password": "password123",
        "metadata": {
            "full_name": "Demo Applicant",
            "role": "applicant"
        }
    },
    {
        "email": "admin@test.com",
        "password": "password123",
        "metadata": {
            "full_name": "Demo Admin",
            "role": "admin"
        }
    }
]

async def create_test_users():
    """Create test users using Supabase Admin API"""
    
    # First, ensure demo company exists
    company_result = supabase_admin.table('companies').select('id').eq('key', 'demo-company-2024').execute()
    
    if not company_result.data:
        # Create demo company
        company = supabase_admin.table('companies').insert({
            "name": "Demo Company",
            "key": "demo-company-2024"
        }).execute()
        company_id = company.data[0]['id']
        print(f"✅ Created demo company: {company_id}")
    else:
        company_id = company_result.data[0]['id']
        print(f"✅ Demo company exists: {company_id}")
    
    # Create users
    for user_data in TEST_USERS:
        try:
            # Create user with admin API
            user_response = supabase_admin.auth.admin.create_user({
                "email": user_data["email"],
                "password": user_data["password"],
                "email_confirm": True,  # Auto-confirm email
                "user_metadata": user_data["metadata"]
            })
            
            if user_response.user:
                user_id = user_response.user.id
                print(f"✅ Created user: {user_data['email']} (ID: {user_id})")
                
                # Update profile with company_id
                profile_response = supabase_admin.table('profiles').upsert({
                    "id": user_id,
                    "company_id": company_id,
                    "role": user_data["metadata"]["role"],
                    "full_name": user_data["metadata"]["full_name"]
                }).execute()
                
                print(f"   ✅ Updated profile for {user_data['email']}")
            else:
                print(f"❌ Failed to create user: {user_data['email']}")
                
        except Exception as e:
            print(f"❌ Error creating {user_data['email']}: {str(e)}")
            # User might already exist, try to update profile
            try:
                # Get user by email
                existing_users = supabase_admin.auth.admin.list_users()
                user = next((u for u in existing_users if u.email == user_data['email']), None)
                
                if user:
                    profile_response = supabase_admin.table('profiles').upsert({
                        "id": user.id,
                        "company_id": company_id,
                        "role": user_data["metadata"]["role"],
                        "full_name": user_data["metadata"]["full_name"]
                    }).execute()
                    print(f"   ✅ Updated existing user profile: {user_data['email']}")
            except Exception as update_error:
                print(f"   ❌ Could not update profile: {str(update_error)}")

def main():
    print("🚀 Creating test users in Supabase...")
    print(f"📍 Supabase URL: {SUPABASE_URL}")
    
    # Run the async function
    asyncio.run(create_test_users())
    
    print("\n✅ Test user creation complete!")
    print("\nYou can now login with:")
    for user in TEST_USERS:
        print(f"  - {user['email']} / {user['password']} ({user['metadata']['role']})")

if __name__ == "__main__":
    main()