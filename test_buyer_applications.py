#!/usr/bin/env python3
"""
Test script to verify buyer applications are working correctly
"""
import httpx
import asyncio
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

async def test_buyer_applications():
    """Test buyer application creation and visibility"""
    async with httpx.AsyncClient() as client:
        print("=== Testing Buyer Applications ===\n")
        
        # 1. Login as buyer
        print("1. Logging in as buyer@test.com...")
        login_response = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={"email": "buyer@test.com", "password": "password123"}
        )
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.text}")
            return
        
        auth_data = login_response.json()
        token = auth_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Logged in successfully")
        
        # 2. Get buyer profile
        print("\n2. Getting buyer profile...")
        me_response = await client.get(f"{BASE_URL}/api/v1/users/me", headers=headers)
        if me_response.status_code == 200:
            user_data = me_response.json()
            print(f"✅ User email: {user_data.get('email')}")
            print(f"✅ User role: {user_data.get('role')}")
            print(f"✅ Company ID: {user_data.get('company_id')}")
        
        # 3. Get available projects
        print("\n3. Getting available projects...")
        projects_response = await client.get(f"{BASE_URL}/api/v1/projects", headers=headers)
        if projects_response.status_code != 200:
            print(f"❌ Failed to get projects: {projects_response.text}")
            return
        
        projects = projects_response.json()
        if not projects:
            print("❌ No projects available")
            return
        
        project = projects[0]
        print(f"✅ Found project: {project['name']} (ID: {project['id']})")
        
        # 4. Check if applicant exists
        print("\n4. Checking for existing applicant record...")
        applicants_response = await client.get(f"{BASE_URL}/api/v1/applicants", headers=headers)
        existing_applicant = None
        if applicants_response.status_code == 200:
            applicants = applicants_response.json()
            for app in applicants:
                if app.get('email') == 'buyer@test.com':
                    existing_applicant = app
                    print(f"✅ Found existing applicant: {app['id']}")
                    break
        
        # 5. Create or get applicant
        if not existing_applicant:
            print("\n5. Creating applicant record...")
            applicant_data = {
                "first_name": "Test",
                "last_name": "Buyer",
                "email": "buyer@test.com",
                "phone": "555-0100",
                "income": 75000,
                "household_size": 2,
                "location_preference": "San Francisco",
                "latitude": 37.7749,
                "longitude": -122.4194
            }
            
            applicant_response = await client.post(
                f"{BASE_URL}/api/v1/applicants",
                json=applicant_data,
                headers=headers
            )
            
            if applicant_response.status_code != 200:
                print(f"❌ Failed to create applicant: {applicant_response.text}")
                return
            
            applicant = applicant_response.json()
            print(f"✅ Created applicant: {applicant['id']}")
        else:
            applicant = existing_applicant
        
        # 6. Create application
        print("\n6. Creating application...")
        application_data = {
            "project_id": project['id'],
            "applicant_id": applicant['id'],
            "preferred_move_in_date": "2024-06-01",
            "additional_notes": f"Test application created at {datetime.now().isoformat()}"
        }
        
        app_response = await client.post(
            f"{BASE_URL}/api/v1/applications",
            json=application_data,
            headers=headers
        )
        
        if app_response.status_code != 200:
            print(f"❌ Failed to create application: {app_response.text}")
            return
        
        new_application = app_response.json()
        print(f"✅ Created application: {new_application['id']}")
        
        # 7. Verify application is visible
        print("\n7. Verifying application visibility...")
        apps_response = await client.get(f"{BASE_URL}/api/v1/applications", headers=headers)
        
        if apps_response.status_code != 200:
            print(f"❌ Failed to get applications: {apps_response.text}")
            return
        
        applications = apps_response.json()
        found = False
        for app in applications.get('data', []):
            if app['id'] == new_application['id']:
                found = True
                print(f"✅ Application found in list!")
                print(f"   - Status: {app['status']}")
                print(f"   - Project: {app.get('projects', {}).get('name', 'Unknown')}")
                print(f"   - Submitted: {app['submitted_at']}")
                break
        
        if not found:
            print("❌ Application NOT found in list!")
            print(f"   Total applications returned: {len(applications.get('data', []))}")
        
        print("\n=== Test Complete ===")

if __name__ == "__main__":
    asyncio.run(test_buyer_applications())