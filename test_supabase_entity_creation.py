#!/usr/bin/env python3
"""
Test script to verify Supabase entity creation is working properly
"""

import os
import json
import requests
from datetime import datetime

# Configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Test users
TEST_USERS = [
    {"email": "developer@test.com", "password": "password123", "role": "developer"},
    {"email": "lender@test.com", "password": "password123", "role": "lender"},
    {"email": "buyer@test.com", "password": "password123", "role": "buyer"},
    {"email": "applicant@test.com", "password": "password123", "role": "applicant"},
    {"email": "admin@test.com", "password": "password123", "role": "admin"}
]

def login_user(email, password):
    """Login a user and return the token"""
    response = requests.post(
        f"{BACKEND_URL}/api/v1/auth/login",
        json={"email": email, "password": password}
    )
    if response.status_code == 200:
        data = response.json()
        return data.get("access_token"), data.get("user")
    else:
        print(f"❌ Login failed for {email}: {response.text}")
        return None, None

def test_create_applicant(token):
    """Test creating an applicant"""
    headers = {"Authorization": f"Bearer {token}"}
    
    applicant_data = {
        "full_name": f"Test Applicant {datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "email": f"testapplicant_{datetime.now().timestamp()}@example.com",
        "phone": "555-0123",
        "income": 50000,
        "household_size": 3,
        "preferences": {
            "location": "Downtown",
            "bedrooms": 2,
            "max_rent": 2000
        }
    }
    
    response = requests.post(
        f"{BACKEND_URL}/api/v1/applicants",
        json=applicant_data,
        headers=headers
    )
    
    if response.status_code == 200:
        print("✅ Successfully created applicant")
        return response.json()
    else:
        print(f"❌ Failed to create applicant: {response.text}")
        return None

def test_create_project(token):
    """Test creating a project (requires developer/admin role)"""
    headers = {"Authorization": f"Bearer {token}"}
    
    project_data = {
        "name": f"Test Project {datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "description": "A test affordable housing project",
        "location": "123 Main St, Test City",
        "total_units": 100,
        "available_units": 50,
        "ami_percentage": 80,
        "amenities": ["Parking", "Gym", "Laundry"],
        "status": "active"
    }
    
    response = requests.post(
        f"{BACKEND_URL}/api/v1/projects",
        json=project_data,
        headers=headers
    )
    
    if response.status_code == 200:
        print("✅ Successfully created project")
        return response.json()
    else:
        print(f"❌ Failed to create project: {response.text}")
        return None

def test_profile_completion(token):
    """Test profile completion endpoint"""
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.post(
        f"{BACKEND_URL}/api/v1/users/complete-profile",
        headers=headers
    )
    
    if response.status_code == 200:
        print("✅ Profile completion successful")
        return response.json()
    else:
        print(f"❌ Profile completion failed: {response.text}")
        return None

def run_tests():
    """Run all entity creation tests"""
    print("🚀 Starting Supabase Entity Creation Tests\n")
    
    results = {
        "total_tests": 0,
        "passed": 0,
        "failed": 0,
        "details": []
    }
    
    for user in TEST_USERS:
        print(f"\n📧 Testing with {user['email']} ({user['role']})")
        print("-" * 50)
        
        # Login
        token, user_data = login_user(user["email"], user["password"])
        if not token:
            results["failed"] += 1
            results["total_tests"] += 1
            results["details"].append({
                "user": user["email"],
                "test": "login",
                "status": "failed"
            })
            continue
        
        print(f"✅ Logged in successfully")
        print(f"   User ID: {user_data.get('id')}")
        print(f"   Company: {user_data.get('company', {}).get('name', 'N/A')}")
        
        # Test profile completion
        results["total_tests"] += 1
        profile_result = test_profile_completion(token)
        if profile_result:
            results["passed"] += 1
            results["details"].append({
                "user": user["email"],
                "test": "profile_completion",
                "status": "passed"
            })
        else:
            results["failed"] += 1
            results["details"].append({
                "user": user["email"],
                "test": "profile_completion",
                "status": "failed"
            })
        
        # Test creating applicant (all roles should be able to)
        results["total_tests"] += 1
        applicant_result = test_create_applicant(token)
        if applicant_result:
            results["passed"] += 1
            results["details"].append({
                "user": user["email"],
                "test": "create_applicant",
                "status": "passed",
                "data": applicant_result
            })
        else:
            results["failed"] += 1
            results["details"].append({
                "user": user["email"],
                "test": "create_applicant",
                "status": "failed"
            })
        
        # Test creating project (only developer/admin should succeed)
        if user["role"] in ["developer", "admin"]:
            results["total_tests"] += 1
            project_result = test_create_project(token)
            if project_result:
                results["passed"] += 1
                results["details"].append({
                    "user": user["email"],
                    "test": "create_project",
                    "status": "passed",
                    "data": project_result
                })
            else:
                results["failed"] += 1
                results["details"].append({
                    "user": user["email"],
                    "test": "create_project",
                    "status": "failed"
                })
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"Total Tests: {results['total_tests']}")
    print(f"Passed: {results['passed']} ✅")
    print(f"Failed: {results['failed']} ❌")
    print(f"Success Rate: {(results['passed']/results['total_tests']*100):.1f}%")
    
    # Save detailed results
    with open("entity_creation_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print("\n📄 Detailed results saved to entity_creation_test_results.json")
    
    return results

if __name__ == "__main__":
    # Check if backend is running
    try:
        response = requests.get(f"{BACKEND_URL}/health")
        if response.status_code != 200:
            print("❌ Backend is not running. Please start it first.")
            sys.exit(1)
    except:
        print("❌ Cannot connect to backend. Please ensure it's running on", BACKEND_URL)
        sys.exit(1)
    
    # Run tests
    results = run_tests()
    
    # Exit with appropriate code
    if results["failed"] > 0:
        sys.exit(1)
    else:
        sys.exit(0)