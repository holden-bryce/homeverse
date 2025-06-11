#!/usr/bin/env python3
"""Test the projects API endpoint to see what data is returned"""
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Test the API endpoint
api_url = os.getenv('NEXT_PUBLIC_API_URL', 'http://localhost:8000')
endpoint = f"{api_url}/api/v1/projects"

print(f"Testing API endpoint: {endpoint}")

try:
    response = requests.get(endpoint)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ API Response successful!")
        print(f"Total projects: {data.get('count', 0)}")
        
        if data.get('data'):
            print("\n📍 Projects data:")
            for project in data['data']:
                print(f"\n- {project.get('name', 'Unknown')}:")
                print(f"  Location: {project.get('location', 'N/A')}")
                print(f"  Coordinates: {project.get('coordinates', 'Not available')}")
                print(f"  Status: {project.get('status', 'N/A')}")
                print(f"  Units: {project.get('available_units', 0)}/{project.get('total_units', 0)}")
                print(f"  AMI: {project.get('ami_percentage', 'N/A')}%")
        else:
            print("\n⚠️  No projects returned")
    else:
        print(f"\n❌ API Error: {response.text}")
        
except Exception as e:
    print(f"\n❌ Connection Error: {e}")
    print("Make sure the backend is running on http://localhost:8000")

print("\n" + "="*50)
print("If coordinates are missing, please run fix_projects_table.sql in Supabase")