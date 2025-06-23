#!/usr/bin/env python3
"""
Debug testing script for HomeVerse application workflow
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

# Test accounts
DEVELOPER = {"email": "developer@test.com", "password": "password123"}
APPLICANT = {"email": "applicant@test.com", "password": "password123"}

def print_section(title):
    print(f"\n{'=' * 60}")
    print(f"🔍 {title}")
    print('=' * 60)

def test_endpoint(method, endpoint, token=None, data=None, description=""):
    """Test an API endpoint and report results"""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)
        elif method == "PATCH":
            response = requests.patch(url, headers=headers, json=data)
        else:
            response = requests.request(method, url, headers=headers, json=data)
        
        if response.status_code in [200, 201]:
            print(f"✅ {description or endpoint}: Success")
            return True, response.json()
        else:
            print(f"❌ {description or endpoint}: {response.status_code}")
            print(f"   Error: {response.text[:200]}")
            return False, None
    except Exception as e:
        print(f"❌ {description or endpoint}: {type(e).__name__}")
        print(f"   Error: {str(e)[:200]}")
        return False, None

def login(credentials, role_name):
    """Login and get token"""
    success, data = test_endpoint("POST", "/api/v1/auth/login", data=credentials, 
                                 description=f"Login as {role_name}")
    if success:
        return data["access_token"]
    return None

def main():
    print("🚀 HomeVerse Debug Testing")
    print("This will test all critical workflows locally")
    
    # Test 1: Backend Health
    print_section("Backend Health Check")
    test_endpoint("GET", "/health", description="Backend health")
    test_endpoint("GET", "/", description="Root endpoint")
    
    # Test 2: Authentication
    print_section("Authentication Tests")
    dev_token = login(DEVELOPER, "Developer")
    app_token = login(APPLICANT, "Applicant")
    
    if not dev_token or not app_token:
        print("\n❌ Authentication failed - cannot proceed with tests")
        return
    
    # Test 3: Core Endpoints
    print_section("Core API Endpoints")
    test_endpoint("GET", "/api/v1/projects", dev_token, description="Get projects")
    test_endpoint("GET", "/api/v1/applicants", dev_token, description="Get applicants")
    test_endpoint("GET", "/api/v1/applications", dev_token, description="Get applications")
    test_endpoint("GET", "/api/v1/investments", dev_token, description="Get investments")
    
    # Test 4: Application Workflow
    print_section("Application Workflow Test")
    
    # Get a project to apply to
    success, projects_data = test_endpoint("GET", "/api/v1/projects", dev_token, 
                                         description="Get projects for application")
    if success and projects_data.get("data"):
        project_id = projects_data["data"][0]["id"]
        print(f"   Using project: {projects_data['data'][0]['name']}")
        
        # Get applicant info
        success, applicants_data = test_endpoint("GET", "/api/v1/applicants", dev_token,
                                               description="Get applicants")
        if success and applicants_data.get("data"):
            applicant_id = applicants_data["data"][0]["id"]
            print(f"   Using applicant: {applicants_data['data'][0]['full_name']}")
            
            # Create application
            app_data = {
                "project_id": project_id,
                "applicant_id": applicant_id,
                "preferred_move_in_date": "2024-12-01",
                "additional_notes": "Debug test application"
            }
            success, new_app = test_endpoint("POST", "/api/v1/applications", dev_token,
                                           data=app_data, description="Create application")
            
            if success and new_app:
                app_id = new_app["id"]
                print(f"   Created application ID: {app_id}")
                
                # Update application status
                update_data = {
                    "status": "under_review",
                    "developer_notes": "Debug test review"
                }
                test_endpoint("PATCH", f"/api/v1/applications/{app_id}", dev_token,
                            data=update_data, description="Update application status")
        else:
            print("   ⚠️  No applicants found - create some test data first")
    else:
        print("   ⚠️  No projects found - create a project first")
    
    # Test 5: Matching Algorithm
    print_section("Matching Algorithm Test")
    if success and projects_data.get("data") and applicants_data.get("data"):
        project_id = projects_data["data"][0]["id"]
        applicant_id = applicants_data["data"][0]["id"]
        
        test_endpoint("GET", f"/api/v1/projects/{project_id}/matches", dev_token,
                     description="Get project matches")
        test_endpoint("GET", f"/api/v1/applicants/{applicant_id}/matches", dev_token,
                     description="Get applicant matches")
    
    # Test 6: Frontend Accessibility
    print_section("Frontend Status")
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is accessible")
            print("   Test these pages manually:")
            print("   • http://localhost:3000/dashboard/projects")
            print("   • http://localhost:3000/dashboard/applications")
            print("   • http://localhost:3000/dashboard/applicants")
        else:
            print(f"⚠️  Frontend returned: {response.status_code}")
    except Exception as e:
        print(f"❌ Frontend error: {e}")
    
    # Summary
    print_section("Debug Summary")
    print("🔍 Key Issues Found:")
    print("1. Check if RLS policies are preventing application creation")
    print("2. Ensure test data exists (projects, applicants)")
    print("3. Verify authentication tokens are working")
    print("\n📋 Next Steps:")
    print("1. Fix any ❌ errors shown above")
    print("2. Run SQL fixes in Supabase dashboard if needed")
    print("3. Test the UI manually in browser")

if __name__ == "__main__":
    main()