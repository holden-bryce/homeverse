#!/usr/bin/env python3
"""Apply schema fixes to Supabase database"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('frontend/.env.local')

# Initialize Supabase client with service role key for admin access
supabase: Client = create_client(
    os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# Read the SQL file
with open('supabase_schema_fix.sql', 'r') as f:
    sql_commands = f.read()

print("🔧 Applying schema fixes to Supabase...")
print("This will add missing columns and create necessary tables.")

# Note: Supabase doesn't support direct SQL execution via the Python client
# You need to run these commands in the Supabase SQL Editor

print("\n⚠️  IMPORTANT: The SQL commands have been saved to 'supabase_schema_fix.sql'")
print("Please follow these steps:")
print("1. Go to your Supabase dashboard: https://app.supabase.com")
print("2. Select your project (vzxadsifonqklotzhdpl)")
print("3. Go to the SQL Editor")
print("4. Copy and paste the contents of 'supabase_schema_fix.sql'")
print("5. Click 'Run' to execute the schema changes")
print("\nAfter running the SQL, the following will be added:")
print("✅ Missing columns in projects table (location, units, amenities, etc.)")
print("✅ Missing columns in applicants table (desired_location)")
print("✅ New project_images table for storing images")
print("✅ Storage bucket for project images")
print("✅ Proper RLS policies and indexes")

# For now, let's test what columns exist
print("\n📊 Checking current schema...")
try:
    # Try to get a project to see what columns exist
    result = supabase.table('projects').select('*').limit(1).execute()
    if result.data:
        print("Current project columns:", list(result.data[0].keys()))
    else:
        print("No projects found, but table exists")
except Exception as e:
    print(f"Error checking projects table: {e}")

try:
    # Check applicants table
    result = supabase.table('applicants').select('*').limit(1).execute()
    if result.data:
        print("Current applicant columns:", list(result.data[0].keys()))
    else:
        print("No applicants found, but table exists")
except Exception as e:
    print(f"Error checking applicants table: {e}")