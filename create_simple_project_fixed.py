#!/usr/bin/env python3
"""Create a project using only the fields that exist in Supabase"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv
import json

load_dotenv('frontend/.env.local')

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')  # Use service role for direct access
)

# Create projects with all required fields
projects = [
    {
        "name": "Sunset Gardens",
        "description": "Affordable housing in Sunset District",
        "address": "100 Sunset Blvd",
        "city": "San Francisco",
        "state": "CA",
        "zip_code": "94122",
        "status": "active",
        "company_id": "e48780e1-02e4-4162-9356-7a6e0e6508fa",  # Default company ID
        "latitude": 37.7558,
        "longitude": -122.4449,
        "total_units": 120,
        "affordable_units": 36,
        "ami_levels": ["30-50%", "50-80%"]
    },
    {
        "name": "Oakland Commons",
        "description": "Mixed-income community in Oakland",
        "address": "500 Broadway",
        "city": "Oakland",
        "state": "CA", 
        "zip_code": "94607",
        "status": "active", 
        "company_id": "e48780e1-02e4-4162-9356-7a6e0e6508fa",
        "latitude": 37.8044,
        "longitude": -122.2711,
        "total_units": 200,
        "affordable_units": 60,
        "ami_levels": ["30-60%", "60-80%"]
    },
    {
        "name": "Mission Bay Towers",
        "description": "New construction near UCSF",
        "address": "1000 Mission Bay Blvd",
        "city": "San Francisco",
        "state": "CA",
        "zip_code": "94158",
        "status": "active",
        "company_id": "e48780e1-02e4-4162-9356-7a6e0e6508fa",
        "latitude": 37.7679,
        "longitude": -122.3954,
        "total_units": 300,
        "affordable_units": 90,
        "ami_levels": ["50-80%", "80-100%"]
    }
]

print("Creating projects directly in Supabase...")

for project in projects:
    try:
        result = supabase.table('projects').insert(project).execute()
        print(f"✅ Created project: {project['name']}")
        print(f"   ID: {result.data[0]['id']}")
    except Exception as e:
        print(f"❌ Failed to create {project['name']}: {e}")

# Check what was created
print("\nChecking all projects...")
try:
    projects = supabase.table('projects').select('*').execute()
    print(f"Total projects: {len(projects.data)}")
    for p in projects.data:
        print(f"  - {p['name']} (ID: {p['id']})")
except Exception as e:
    print(f"Error fetching projects: {e}")