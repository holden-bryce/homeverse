#!/usr/bin/env python3
"""Quick script to create test users NOW"""
import os

# Set your service key here temporarily
SERVICE_KEY = input("Paste your Supabase service key: ").strip()

# Set environment variable for the agent
os.environ["SUPABASE_SERVICE_KEY"] = SERVICE_KEY

# Import and use the agent
from supabase_admin_agent import SupabaseAdminAgent

print("\n🚀 Creating test users...\n")

agent = SupabaseAdminAgent()

# Check health first
health = agent.check_health()
if not health['connected']:
    print("❌ Cannot connect to Supabase!")
    exit(1)

print("✅ Connected to Supabase\n")

# Create test users
results = agent.create_test_users()

print("\n📊 Summary:")
successful = sum(1 for r in results if r['success'])
print(f"✅ Successfully created: {successful} users")
print(f"❌ Failed: {len(results) - successful} users")

if successful == len(results):
    print("\n🎉 All test users created successfully!")
    print("\nYou can now login at https://homeverse-frontend.onrender.com with:")
    print("  - developer@test.com / password123")
    print("  - lender@test.com / password123")
    print("  - buyer@test.com / password123")
    print("  - applicant@test.com / password123")
    print("  - admin@test.com / password123")
else:
    print("\n⚠️ Some users failed to create. They might already exist.")
    print("Try logging in anyway - the users might have been created previously.")