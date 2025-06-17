#!/usr/bin/env python3
"""Check the exact schema of the projects table"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('frontend/.env.local')

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# Get table info using a raw SQL query through RPC
print("Checking projects table schema...")

# Try to insert an empty project to see what fields are required
try:
    result = supabase.table('projects').insert({
        "name": "Test",
        "company_id": "e48780e1-02e4-4162-9356-7a6e0e6508fa"
    }).execute()
    print("Minimal insert succeeded!")
except Exception as e:
    error_msg = str(e)
    print(f"Error: {error_msg}")
    
    # Parse the error to understand required fields
    if "violates not-null constraint" in error_msg:
        import re
        field_match = re.search(r'column "(\w+)" of relation', error_msg)
        if field_match:
            print(f"Required field missing: {field_match.group(1)}")

# List all required fields based on the error messages we've seen
print("\nBased on errors, required fields are:")
print("- name (string)")
print("- company_id (uuid)")
print("- address (string)")
print("- city (string)")
print("- status (string, default: 'active')")
print("- latitude (float)")
print("- longitude (float)")

print("\nLet's create a complete project...")

# Create a project with all required fields
project = {
    "name": "Test Project",
    "description": "A test project with all required fields",
    "company_id": "e48780e1-02e4-4162-9356-7a6e0e6508fa",
    "address": "123 Test Street",
    "city": "San Francisco",
    "state": "CA",
    "zip_code": "94105",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "status": "active"
}

try:
    result = supabase.table('projects').insert(project).execute()
    print(f"✅ Success! Created project: {result.data[0]['name']}")
    print(f"Project ID: {result.data[0]['id']}")
    print("\nAll columns in the project:")
    for key, value in result.data[0].items():
        print(f"  {key}: {value}")
except Exception as e:
    print(f"❌ Failed: {e}")