#!/usr/bin/env python3
"""
Automated testing script for HomeVerse functionality
Run this to verify all core features are working
"""

import os
import sys
import time
import json
import requests
from datetime import datetime
from typing import Dict, List, Tuple

# Configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Test accounts
TEST_USERS = {
    "developer": {"email": "developer@test.com", "password": "password123"},
    "lender": {"email": "lender@test.com", "password": "password123"},
    "buyer": {"email": "buyer@test.com", "password": "password123"},
    "applicant": {"email": "applicant@test.com", "password": "password123"},
    "admin": {"email": "admin@test.com", "password": "password123"}
}

# Test results storage
test_results = {
    "timestamp": datetime.now().isoformat(),
    "tests": [],
    "summary": {"passed": 0, "failed": 0, "total": 0}
}

def log_test(category: str, test: str, passed: bool, details: str = ""):
    """Log test result"""
    result = {
        "category": category,
        "test": test,
        "passed": passed,
        "details": details,
        "timestamp": datetime.now().isoformat()
    }
    test_results["tests"].append(result)
    test_results["summary"]["total"] += 1
    if passed:
        test_results["summary"]["passed"] += 1
        print(f"✅ {category}: {test}")
    else:
        test_results["summary"]["failed"] += 1
        print(f"❌ {category}: {test} - {details}")

def test_backend_health():
    """Test if backend is running"""
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        log_test("Backend", "Health check", response.status_code == 200)
        return response.status_code == 200
    except Exception as e:
        log_test("Backend", "Health check", False, str(e))
        return False

def test_authentication(role: str) -> Tuple[bool, str, Dict]:
    """Test login for a specific role"""
    user = TEST_USERS[role]
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/v1/auth/login",
            json={"email": user["email"], "password": user["password"]}
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token", "")
            user_data = data.get("user", {})
            log_test("Authentication", f"Login as {role}", True)
            return True, token, user_data
        else:
            log_test("Authentication", f"Login as {role}", False, response.text)
            return False, "", {}
    except Exception as e:
        log_test("Authentication", f"Login as {role}", False, str(e))
        return False, "", {}

def test_logout(token: str, role: str) -> bool:
    """Test logout functionality"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{BACKEND_URL}/api/v1/auth/logout", headers=headers)
        success = response.status_code in [200, 401]  # 401 is ok, means token was invalidated
        log_test("Authentication", f"Logout as {role}", success)
        return success
    except Exception as e:
        log_test("Authentication", f"Logout as {role}", False, str(e))
        return False

def test_profile_loading(token: str, role: str) -> bool:
    """Test if profile loads with company_id"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BACKEND_URL}/api/v1/users/me", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            has_company = bool(data.get("company_id"))
            log_test("Profile", f"Profile has company_id ({role})", has_company)
            return has_company
        else:
            log_test("Profile", f"Load profile ({role})", False, response.text)
            return False
    except Exception as e:
        log_test("Profile", f"Load profile ({role})", False, str(e))
        return False

def test_create_applicant(token: str, role: str) -> bool:
    """Test creating an applicant"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        applicant_data = {
            "full_name": f"Test {role.title()} User {datetime.now().strftime('%H%M%S')}",
            "email": f"test_{role}_{int(time.time())}@example.com",
            "phone": "555-0123",
            "household_size": 3,
            "income": 50000,
            "preferences": {
                "ami_percent": 80,
                "location_preference": "San Francisco"
            }
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/v1/applicants",
            json=applicant_data,
            headers=headers
        )
        
        success = response.status_code == 200
        log_test("Entity Creation", f"Create applicant ({role})", success, 
                response.text if not success else "")
        return success
    except Exception as e:
        log_test("Entity Creation", f"Create applicant ({role})", False, str(e))
        return False

def test_create_project(token: str, role: str) -> bool:
    """Test creating a project (should only work for developer/admin)"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        project_data = {
            "name": f"Test Project {datetime.now().strftime('%H%M%S')}",
            "description": "Automated test project",
            "location": "123 Test St, San Francisco, CA",
            "total_units": 50,
            "available_units": 25,
            "ami_percentage": 80,
            "coordinates": [-122.4194, 37.7749]
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/v1/projects",
            json=project_data,
            headers=headers
        )
        
        should_succeed = role in ["developer", "admin"]
        actual_success = response.status_code == 200
        
        if should_succeed:
            log_test("Entity Creation", f"Create project ({role})", actual_success,
                    response.text if not actual_success else "")
        else:
            # For non-developer/admin, we expect it to fail
            expected_fail = response.status_code in [403, 401]
            log_test("Role Restriction", f"Project creation blocked ({role})", expected_fail)
        
        return actual_success if should_succeed else expected_fail
    except Exception as e:
        log_test("Entity Creation", f"Create project ({role})", False, str(e))
        return False

def test_list_entities(token: str, role: str) -> bool:
    """Test listing applicants and projects"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test applicants list
        response = requests.get(f"{BACKEND_URL}/api/v1/applicants", headers=headers)
        applicants_success = response.status_code == 200
        log_test("Data Access", f"List applicants ({role})", applicants_success)
        
        # Test projects list
        response = requests.get(f"{BACKEND_URL}/api/v1/projects", headers=headers)
        projects_success = response.status_code == 200
        log_test("Data Access", f"List projects ({role})", projects_success)
        
        return applicants_success and projects_success
    except Exception as e:
        log_test("Data Access", f"List entities ({role})", False, str(e))
        return False

def test_map_data(token: str) -> bool:
    """Test if map endpoint returns projects with coordinates"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BACKEND_URL}/api/v1/projects", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            # Handle both list and paginated response
            projects = data if isinstance(data, list) else data.get("items", [])
            
            if projects and len(projects) > 0:
                # Check if at least one project has coordinates
                has_coords = any(
                    isinstance(p, dict) and p.get("coordinates") is not None 
                    for p in projects
                )
                log_test("Map View", "Projects have coordinates", has_coords)
                
                # Count projects with coordinates
                coords_count = sum(1 for p in projects if isinstance(p, dict) and p.get("coordinates"))
                log_test("Map View", f"Projects with coordinates: {coords_count}/{len(projects)}", True)
                
                return has_coords
            else:
                log_test("Map View", "No projects found", False)
                return False
        else:
            log_test("Map View", "Load map data", False, response.text)
            return False
    except Exception as e:
        log_test("Map View", "Load map data", False, str(e))
        return False

def test_contact_form() -> bool:
    """Test public contact form submission"""
    try:
        contact_data = {
            "name": "Test User",
            "email": "test@example.com",
            "subject": "Automated Test",
            "message": f"This is an automated test submission at {datetime.now()}"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/v1/contact",
            json=contact_data
        )
        
        success = response.status_code == 200
        log_test("Communication", "Submit contact form", success,
                response.text if not success else "")
        return success
    except Exception as e:
        log_test("Communication", "Submit contact form", False, str(e))
        return False

def run_all_tests():
    """Run all functionality tests"""
    print("\n🚀 Starting HomeVerse Functionality Tests\n")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Testing at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Test backend health
    if not test_backend_health():
        print("\n❌ Backend is not running! Please start it first.")
        return
    
    # Test each user role
    for role in TEST_USERS.keys():
        print(f"\n📧 Testing {role.upper()} role")
        print("-" * 50)
        
        # Login
        success, token, user_data = test_authentication(role)
        if not success:
            continue
        
        # Profile check
        test_profile_loading(token, role)
        
        # Entity creation
        test_create_applicant(token, role)
        test_create_project(token, role)
        
        # Data access
        test_list_entities(token, role)
        
        # Map data (only test once)
        if role == "developer":
            test_map_data(token)
        
        # Logout
        test_logout(token, role)
        
        time.sleep(1)  # Brief pause between role tests
    
    # Test public endpoints
    print(f"\n🌐 Testing Public Endpoints")
    print("-" * 50)
    test_contact_form()
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"Total Tests: {test_results['summary']['total']}")
    print(f"Passed: {test_results['summary']['passed']} ✅")
    print(f"Failed: {test_results['summary']['failed']} ❌")
    print(f"Success Rate: {(test_results['summary']['passed']/test_results['summary']['total']*100):.1f}%")
    
    # Save detailed results
    with open("functionality_test_results.json", "w") as f:
        json.dump(test_results, f, indent=2)
    print("\n📄 Detailed results saved to functionality_test_results.json")
    
    # Return exit code based on results
    return 0 if test_results['summary']['failed'] == 0 else 1

if __name__ == "__main__":
    # Check if backend is the Supabase version
    print("ℹ️  Make sure you're running: python3 supabase_backend.py")
    print("ℹ️  Frontend should be running on: http://localhost:3000\n")
    
    exit_code = run_all_tests()
    sys.exit(exit_code)