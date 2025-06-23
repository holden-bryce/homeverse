#!/usr/bin/env python3
"""
Test all server-side operations to ensure they work correctly
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

# Test user credentials
TEST_USER = {
    "email": "developer@test.com",
    "password": "password123"
}

def print_result(test_name, success, details=""):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"\n{status} - {test_name}")
    if details:
        print(f"   Details: {details}")

def test_auth_and_get_token():
    """Test authentication and get token"""
    print("\n🔐 Testing Authentication...")
    
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json=TEST_USER
    )
    
    if response.status_code == 200:
        data = response.json()
        token = data.get("access_token")
        print_result("Authentication", True, f"Token obtained for {TEST_USER['email']}")
        return token
    else:
        print_result("Authentication", False, f"Status: {response.status_code}")
        return None

def test_project_operations(token):
    """Test project CRUD operations"""
    print("\n🏗️ Testing Project Operations...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create project
    project_data = {
        "name": f"Test Project {int(time.time())}",
        "description": "Server-side test project",
        "address": "123 Test Street",
        "city": "San Francisco",
        "state": "CA",
        "zip_code": "94102",
        "total_units": 100,
        "affordable_units": 30,
        "ami_levels": ["30-50%", "50-80%", "80-120%"],
        "latitude": 37.7749,
        "longitude": -122.4194,
        "status": "planning"
    }
    
    # Test CREATE
    create_response = requests.post(
        f"{BASE_URL}/api/v1/projects",
        json=project_data,
        headers=headers
    )
    
    if create_response.status_code == 200:
        project = create_response.json()
        project_id = project["id"]
        print_result("Create Project", True, f"ID: {project_id}")
        
        # Test READ
        get_response = requests.get(
            f"{BASE_URL}/api/v1/projects/{project_id}",
            headers=headers
        )
        print_result("Get Project", get_response.status_code == 200)
        
        # Test UPDATE
        update_data = {"status": "approved", "total_units": 150}
        update_response = requests.put(
            f"{BASE_URL}/api/v1/projects/{project_id}",
            json=update_data,
            headers=headers
        )
        print_result("Update Project", update_response.status_code == 200)
        
        # Test LIST
        list_response = requests.get(
            f"{BASE_URL}/api/v1/projects",
            headers=headers
        )
        print_result("List Projects", list_response.status_code == 200, 
                    f"Found {len(list_response.json())} projects")
        
        return project_id
    else:
        print_result("Create Project", False, 
                    f"Status: {create_response.status_code}, Error: {create_response.text}")
        return None

def test_applicant_operations(token):
    """Test applicant CRUD operations"""
    print("\n👥 Testing Applicant Operations...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create applicant
    applicant_data = {
        "first_name": "Test",
        "last_name": "Applicant",
        "email": f"test_{int(time.time())}@example.com",
        "phone": "555-0123",
        "income": 60000,
        "household_size": 2,
        "ami_percent": 80.0,
        "latitude": 37.7749,
        "longitude": -122.4194
    }
    
    # Test CREATE
    create_response = requests.post(
        f"{BASE_URL}/api/v1/applicants",
        json=applicant_data,
        headers=headers
    )
    
    if create_response.status_code == 200:
        applicant = create_response.json()
        applicant_id = applicant["id"]
        print_result("Create Applicant", True, f"ID: {applicant_id}")
        
        # Test READ
        get_response = requests.get(
            f"{BASE_URL}/api/v1/applicants/{applicant_id}",
            headers=headers
        )
        print_result("Get Applicant", get_response.status_code == 200)
        
        # Test UPDATE
        update_data = {"phone": "555-9999", "income": 65000}
        update_response = requests.put(
            f"{BASE_URL}/api/v1/applicants/{applicant_id}",
            json=update_data,
            headers=headers
        )
        print_result("Update Applicant", update_response.status_code == 200)
        
        # Test LIST
        list_response = requests.get(
            f"{BASE_URL}/api/v1/applicants",
            headers=headers
        )
        print_result("List Applicants", list_response.status_code == 200, 
                    f"Found {len(list_response.json())} applicants")
        
        return applicant_id
    else:
        print_result("Create Applicant", False, 
                    f"Status: {create_response.status_code}, Error: {create_response.text}")
        return None

def test_application_submission(token, project_id, applicant_id):
    """Test application submission"""
    print("\n📋 Testing Application Submission...")
    
    if not project_id or not applicant_id:
        print_result("Application Submission", False, "Missing project or applicant ID")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    application_data = {
        "project_id": project_id,
        "applicant_id": applicant_id,
        "unit_type": "2BR",
        "message": "Test application"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/applications",
        json=application_data,
        headers=headers
    )
    
    print_result("Submit Application", response.status_code == 200,
                f"Status: {response.status_code}")

def test_investment_operations(token, project_id):
    """Test investment operations"""
    print("\n💰 Testing Investment Operations...")
    
    if not project_id:
        print_result("Investment Operations", False, "Missing project ID")
        return
    
    # Get lender token
    lender_response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"email": "lender@test.com", "password": "password123"}
    )
    
    if lender_response.status_code != 200:
        print_result("Lender Login", False)
        return
    
    lender_token = lender_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {lender_token}"}
    
    investment_data = {
        "project_id": project_id,
        "amount": 1000000,
        "investment_type": "construction_loan",
        "interest_rate": 5.5,
        "term_months": 24
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/investments",
        json=investment_data,
        headers=headers
    )
    
    print_result("Create Investment", response.status_code == 200,
                f"Status: {response.status_code}")

def main():
    """Run all tests"""
    print("🧪 Testing Server-Side Operations")
    print("=" * 50)
    
    # Get authentication token
    token = test_auth_and_get_token()
    if not token:
        print("\n❌ Cannot continue without authentication")
        return
    
    # Test all operations
    project_id = test_project_operations(token)
    applicant_id = test_applicant_operations(token)
    
    if project_id and applicant_id:
        test_application_submission(token, project_id, applicant_id)
    
    if project_id:
        test_investment_operations(token, project_id)
    
    print("\n" + "=" * 50)
    print("✅ Server-side testing complete!")
    print("\nNOTE: To fix any RLS policy issues, run the SQL script:")
    print("  fix_all_rls_policies.sql")

if __name__ == "__main__":
    main()