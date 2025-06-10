#!/usr/bin/env python3
"""Quick script to create test users in Supabase"""
import os
from supabase import create_client

# Your Supabase credentials
SUPABASE_URL = "https://vzxadsifonqklotzhdpl.supabase.co"
SUPABASE_SERVICE_KEY = input("Enter your Supabase service key: ")

# Initialize admin client
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Test users
users = [
    ("developer@test.com", "password123", "developer", "Demo Developer"),
    ("lender@test.com", "password123", "lender", "Demo Lender"),
    ("buyer@test.com", "password123", "buyer", "Demo Buyer"),
    ("applicant@test.com", "password123", "applicant", "Demo Applicant"),
    ("admin@test.com", "password123", "admin", "Demo Admin"),
]

# Get or create demo company
company = supabase.table('companies').select('id').eq('key', 'demo-company-2024').execute()
if not company.data:
    company = supabase.table('companies').insert({
        "name": "Demo Company",
        "key": "demo-company-2024"
    }).execute()
    company_id = company.data[0]['id']
    print(f"✅ Created demo company: {company_id}")
else:
    company_id = company.data[0]['id']
    print(f"✅ Demo company exists: {company_id}")

# Create users
for email, password, role, name in users:
    try:
        # Create user
        user_response = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"full_name": name, "role": role}
        })
        
        if user_response.user:
            # Update profile
            supabase.table('profiles').upsert({
                "id": user_response.user.id,
                "company_id": company_id,
                "role": role,
                "full_name": name
            }).execute()
            print(f"✅ Created {email}")
    except Exception as e:
        print(f"❌ Error with {email}: {str(e)}")

print("\n✅ Done! You can now login with:")
for email, _, role, _ in users:
    print(f"  - {email} / password123 ({role})")