#!/usr/bin/env python3
"""Test script to verify application approval/rejection functionality"""

import requests
import json
from datetime import datetime

# Test configuration
API_URL = "http://localhost:8000"

# Test accounts
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
        return data.get("access_token")
    else:
        print(f"Login failed: {response.status_code}")
        print(response.json())
        return None

def get_applications(token):
    """Get all applications"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_URL}/api/v1/applications", headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to get applications: {response.status_code}")
        return {"data": []}

def update_application_status(token, application_id, status, notes=None):
    """Update application status"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    update_data = {
        "status": status
    }
    
    if notes:
        update_data["developer_notes"] = notes
    
    response = requests.patch(
        f"{API_URL}/api/v1/applications/{application_id}",
        headers=headers,
        json=update_data
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to update application: {response.status_code}")
        print(response.json())
        return None

def main():
    print("🏠 Testing Application Approval/Rejection Functionality")
    print("=" * 60)
    
    # Step 1: Login as developer
    print("\n1️⃣ Logging in as developer...")
    token = login(DEVELOPER_CREDENTIALS["email"], DEVELOPER_CREDENTIALS["password"])
    if not token:
        print("❌ Login failed. Make sure backend is running on http://localhost:8000")
        return
    print("✅ Developer logged in successfully")
    
    # Step 2: Get applications
    print("\n2️⃣ Getting applications...")
    applications_data = get_applications(token)
    applications = applications_data.get("data", [])
    
    if not applications:
        print("❌ No applications found. Please submit an application as a buyer first.")
        return
    
    print(f"✅ Found {len(applications)} applications:")
    for app in applications:
        applicant_name = "Unknown"
        if app.get('applicants'):
            applicant = app['applicants']
            applicant_name = f"{applicant.get('first_name', '')} {applicant.get('last_name', '')}".strip()
        
        project_name = app.get('projects', {}).get('name', 'Unknown Project')
        print(f"   - ID: {app['id'][:8]}... | {project_name} | {applicant_name} | Status: {app['status']}")
    
    # Step 3: Test status updates
    print("\n3️⃣ Testing status updates...")
    
    # Find applications in different states
    submitted_apps = [app for app in applications if app['status'] == 'submitted']
    review_apps = [app for app in applications if app['status'] == 'under_review']
    
    # Test marking as under review
    if submitted_apps:
        test_app = submitted_apps[0]
        print(f"\n   Testing: Mark application as under review...")
        result = update_application_status(token, test_app['id'], 'under_review')
        if result:
            print(f"   ✅ Successfully marked application as under review")
        else:
            print(f"   ❌ Failed to update application status")
    
    # Test approval
    if review_apps or submitted_apps:
        test_app = review_apps[0] if review_apps else submitted_apps[0]
        print(f"\n   Testing: Approve application...")
        result = update_application_status(
            token, 
            test_app['id'], 
            'approved',
            'Application meets all requirements. Approved for housing.'
        )
        if result:
            print(f"   ✅ Successfully approved application")
            print(f"      - Status: {result.get('status')}")
            print(f"      - Notes: {result.get('developer_notes')}")
        else:
            print(f"   ❌ Failed to approve application")
    
    # Test rejection (if we have more than one application)
    if len(applications) > 1:
        test_app = applications[1]
        print(f"\n   Testing: Reject application...")
        result = update_application_status(
            token, 
            test_app['id'], 
            'rejected',
            'Income requirements not met.'
        )
        if result:
            print(f"   ✅ Successfully rejected application")
            print(f"      - Status: {result.get('status')}")
            print(f"      - Notes: {result.get('developer_notes')}")
        else:
            print(f"   ❌ Failed to reject application")
    
    # Step 4: Verify updates
    print("\n4️⃣ Verifying updates...")
    updated_apps = get_applications(token)
    if updated_apps.get("data"):
        print("✅ Current application statuses:")
        for app in updated_apps["data"][:5]:  # Show first 5
            applicant_name = "Unknown"
            if app.get('applicants'):
                applicant = app['applicants']
                applicant_name = f"{applicant.get('first_name', '')} {applicant.get('last_name', '')}".strip()
            
            status_emoji = {
                'approved': '✅',
                'rejected': '❌',
                'under_review': '👀',
                'submitted': '📝'
            }.get(app['status'], '❓')
            
            print(f"   {status_emoji} {applicant_name}: {app['status']}")
            if app.get('developer_notes'):
                print(f"      Notes: {app['developer_notes']}")
    
    print("\n✅ Test completed!")
    print("\nNote: The frontend should now show:")
    print("- Approve/Reject buttons for submitted applications")
    print("- Status badges with appropriate colors")
    print("- Developer notes on reviewed applications")
    print("- Email notifications sent to applicants (check logs)")

if __name__ == "__main__":
    main()