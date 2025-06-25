#!/usr/bin/env python3
"""Test script to verify application submission and viewing flow"""

import requests
import json
from datetime import datetime

# Test configuration
API_URL = "http://localhost:8000"

# Test accounts
BUYER_CREDENTIALS = {
    "email": "buyer@test.com",
    "password": "password123"
}

DEVELOPER_CREDENTIALS = {
    "email": "developer@test.com",
    "password": "password123"
}

def login(email, password):
    """Login and get access token"""
    response = requests.post(f"{API_URL}/api/auth/login", json={
        "email": email,
        "password": password
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("access_token"), data.get("user")
    else:
        print(f"Login failed for {email}: {response.status_code}")
        print(response.json())
        return None, None

def get_projects(token):
    """Get all projects"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_URL}/api/v1/projects", headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to get projects: {response.status_code}")
        return []

def create_application(token, project_id, applicant_data):
    """Submit an application"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # First create or find applicant
    applicant_response = requests.post(
        f"{API_URL}/api/v1/applicants",
        headers=headers,
        json=applicant_data
    )
    
    if applicant_response.status_code not in [200, 201]:
        print(f"Failed to create applicant: {applicant_response.status_code}")
        print(applicant_response.json())
        return None
    
    applicant = applicant_response.json()
    
    # Then create application
    application_data = {
        "project_id": project_id,
        "applicant_id": applicant["id"],
        "preferred_move_in_date": "2024-06-01",
        "additional_notes": "Test application from buyer",
        "documents": []
    }
    
    response = requests.post(
        f"{API_URL}/api/v1/applications",
        headers=headers,
        json=application_data
    )
    
    if response.status_code in [200, 201]:
        return response.json()
    else:
        print(f"Failed to create application: {response.status_code}")
        print(response.json())
        return None

def get_applications(token, filters=None):
    """Get applications with optional filters"""
    headers = {"Authorization": f"Bearer {token}"}
    params = filters or {}
    response = requests.get(f"{API_URL}/api/v1/applications", headers=headers, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to get applications: {response.status_code}")
        print(response.json())
        return {"data": []}

def main():
    print("🏠 Testing Application Submission and Viewing Flow")
    print("=" * 60)
    
    # Step 1: Login as buyer
    print("\n1️⃣ Logging in as buyer...")
    buyer_token, buyer_user = login(BUYER_CREDENTIALS["email"], BUYER_CREDENTIALS["password"])
    if not buyer_token:
        print("❌ Buyer login failed. Make sure backend is running.")
        return
    print("✅ Buyer logged in successfully")
    
    # Step 2: Get available projects
    print("\n2️⃣ Getting available projects...")
    projects = get_projects(buyer_token)
    if not projects:
        print("❌ No projects found. Please create a project first.")
        return
    
    print(f"✅ Found {len(projects)} projects")
    first_project = projects[0]
    print(f"   Using project: {first_project['name']} (ID: {first_project['id']})")
    
    # Step 3: Submit application as buyer
    print("\n3️⃣ Submitting application as buyer...")
    applicant_data = {
        "first_name": "Test",
        "last_name": "Buyer",
        "email": BUYER_CREDENTIALS["email"],
        "phone": "555-0123",
        "income": 50000,
        "household_size": 2,
        "ami_percent": 80,
        "location_preference": "San Francisco"
    }
    
    application = create_application(buyer_token, first_project['id'], applicant_data)
    if application:
        print("✅ Application submitted successfully")
        print(f"   Application ID: {application['id']}")
        print(f"   Status: {application['status']}")
    else:
        print("❌ Failed to submit application")
        return
    
    # Step 4: Check buyer can see their application
    print("\n4️⃣ Checking buyer's applications...")
    buyer_applications = get_applications(buyer_token)
    if buyer_applications["data"]:
        print(f"✅ Buyer can see {len(buyer_applications['data'])} applications")
        for app in buyer_applications["data"]:
            print(f"   - {app.get('projects', {}).get('name', 'Unknown')} ({app['status']})")
    else:
        print("⚠️  Buyer cannot see any applications")
    
    # Step 5: Login as developer
    print("\n5️⃣ Logging in as developer...")
    dev_token, dev_user = login(DEVELOPER_CREDENTIALS["email"], DEVELOPER_CREDENTIALS["password"])
    if not dev_token:
        print("❌ Developer login failed")
        return
    print("✅ Developer logged in successfully")
    
    # Step 6: Check developer can see applications
    print("\n6️⃣ Checking developer's view of applications...")
    dev_applications = get_applications(dev_token)
    if dev_applications["data"]:
        print(f"✅ Developer can see {len(dev_applications['data'])} applications")
        for app in dev_applications["data"]:
            applicant_name = "Unknown"
            if app.get('applicants'):
                applicant_name = f"{app['applicants'].get('first_name', '')} {app['applicants'].get('last_name', '')}".strip()
            print(f"   - {app.get('projects', {}).get('name', 'Unknown')} - {applicant_name} ({app['status']})")
    else:
        print("❌ Developer cannot see any applications")
        print("   This might be because:")
        print("   - Applications are not being saved with the correct company_id")
        print("   - The developer is in a different company than the project")
        print("   - There's an issue with the database query")
    
    # Step 7: Summary
    print("\n📊 Summary:")
    print(f"   - Buyer submitted: {1 if application else 0} application(s)")
    print(f"   - Buyer can see: {len(buyer_applications['data'])} application(s)")
    print(f"   - Developer can see: {len(dev_applications['data'])} application(s)")
    
    if len(dev_applications['data']) == 0 and application:
        print("\n⚠️  Issue detected: Developer cannot see buyer's applications!")
        print("   Possible fixes:")
        print("   1. Ensure applications are saved with the project's company_id")
        print("   2. Check that developer and project are in the same company")
        print("   3. Verify the applications query includes company filtering")

if __name__ == "__main__":
    main()