#!/usr/bin/env python3
"""
Test complete HomeVerse functionality including frontend/backend integration
"""

import requests
import json
from datetime import datetime
import subprocess
import time

# URLs
FRONTEND_URL = "http://localhost:3000"
BACKEND_URL = "http://localhost:8000"

class FunctionalityTester:
    def __init__(self):
        self.results = []
        self.session = requests.Session()
        
    def log(self, test, status, details=""):
        result = {
            "test": test,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        print(f"{'✅' if status == 'PASS' else '❌'} {test}: {details}")
        
    def test_servers_running(self):
        """Check if both servers are running"""
        # Check backend
        try:
            resp = requests.get(f"{BACKEND_URL}/health", timeout=5)
            self.log("Backend Server", "PASS" if resp.status_code == 200 else "FAIL", 
                    f"Status: {resp.status_code}")
        except:
            self.log("Backend Server", "FAIL", "Not responding")
            return False
            
        # Check frontend
        try:
            resp = requests.get(FRONTEND_URL, timeout=5)
            self.log("Frontend Server", "PASS" if resp.status_code == 200 else "FAIL",
                    f"Status: {resp.status_code}")
        except:
            self.log("Frontend Server", "FAIL", "Not responding")
            return False
            
        return True
        
    def test_backend_auth_flow(self):
        """Test backend authentication flow"""
        # Test registration (might fail if user exists)
        test_user = {
            "email": f"test_user_{int(time.time())}@example.com",
            "password": "TestPass123!",
            "first_name": "Test",
            "last_name": "User",
            "role": "applicant"
        }
        
        # Try registration
        resp = self.session.post(f"{BACKEND_URL}/api/v1/auth/register", json=test_user)
        if resp.status_code in [200, 201]:
            self.log("User Registration", "PASS", f"Created: {test_user['email']}")
        else:
            self.log("User Registration", "SKIP", f"Status: {resp.status_code}")
            
        # Test login with existing user
        login_data = {
            "email": "developer@test.com",
            "password": "password123"
        }
        
        resp = self.session.post(f"{BACKEND_URL}/api/v1/auth/login", json=login_data)
        if resp.status_code == 200:
            data = resp.json()
            self.log("Backend Login", "PASS", f"User: {data.get('user', {}).get('email')}")
            return data.get("access_token")
        else:
            self.log("Backend Login", "FAIL", f"Status: {resp.status_code}, Error: {resp.text}")
            return None
            
    def test_applicant_crud(self, token):
        """Test applicant CRUD operations"""
        if not token:
            self.log("Applicant CRUD", "SKIP", "No auth token")
            return
            
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create applicant
        applicant_data = {
            "first_name": "Test",
            "last_name": f"Applicant_{int(time.time())}",
            "email": f"applicant_{int(time.time())}@test.com",
            "phone": "555-1234",
            "address": "123 Test St",
            "city": "Test City",
            "state": "CA",
            "zip": "90210",
            "annual_income": 75000,
            "household_size": 3,
            "credit_score": 720
        }
        
        resp = self.session.post(
            f"{BACKEND_URL}/api/v1/applicants",
            json=applicant_data,
            headers=headers
        )
        
        if resp.status_code in [200, 201]:
            created = resp.json()
            self.log("Create Applicant", "PASS", 
                    f"ID: {created.get('id')}, Name: {created.get('first_name')} {created.get('last_name')}")
            
            # List applicants
            resp = self.session.get(f"{BACKEND_URL}/api/v1/applicants", headers=headers)
            if resp.status_code == 200:
                applicants = resp.json()
                self.log("List Applicants", "PASS", f"Found {len(applicants)} applicants")
            else:
                self.log("List Applicants", "FAIL", f"Status: {resp.status_code}")
                
            return created.get('id')
        else:
            self.log("Create Applicant", "FAIL", 
                    f"Status: {resp.status_code}, Error: {resp.text}")
            return None
            
    def test_project_crud(self, token):
        """Test project CRUD operations"""
        if not token:
            self.log("Project CRUD", "SKIP", "No auth token")
            return
            
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create project
        project_data = {
            "name": f"Test Project {int(time.time())}",
            "address": "456 Project Blvd",
            "city": "Project City",
            "state": "CA",
            "zip": "90211",
            "latitude": 34.0522,
            "longitude": -118.2437,
            "total_units": 150,
            "affordable_units": 45,
            "ami_percentage": 80,
            "status": "planning",
            "description": "Test project for functionality testing"
        }
        
        resp = self.session.post(
            f"{BACKEND_URL}/api/v1/projects",
            json=project_data,
            headers=headers
        )
        
        if resp.status_code in [200, 201]:
            created = resp.json()
            self.log("Create Project", "PASS", 
                    f"ID: {created.get('id')}, Name: {created.get('name')}")
            
            # List projects
            resp = self.session.get(f"{BACKEND_URL}/api/v1/projects", headers=headers)
            if resp.status_code == 200:
                projects = resp.json()
                self.log("List Projects", "PASS", f"Found {len(projects)} projects")
            else:
                self.log("List Projects", "FAIL", f"Status: {resp.status_code}")
                
            return created.get('id')
        else:
            self.log("Create Project", "FAIL", 
                    f"Status: {resp.status_code}, Error: {resp.text}")
            return None
            
    def test_frontend_auth_integration(self):
        """Test frontend authentication through backend"""
        # Check if login page is accessible
        resp = requests.get(f"{FRONTEND_URL}/auth/login")
        if resp.status_code == 200:
            self.log("Frontend Login Page", "PASS", "Accessible")
        else:
            self.log("Frontend Login Page", "FAIL", f"Status: {resp.status_code}")
            
        # The actual login would require browser automation
        # For now, we've verified the backend auth works
        
    def test_data_isolation(self):
        """Test multi-tenant data isolation"""
        # Login as developer@test.com
        resp1 = self.session.post(
            f"{BACKEND_URL}/api/v1/auth/login",
            json={"email": "developer@test.com", "password": "password123"}
        )
        
        if resp1.status_code == 200:
            token1 = resp1.json().get("access_token")
            
            # Create test data
            headers1 = {"Authorization": f"Bearer {token1}"}
            resp = self.session.post(
                f"{BACKEND_URL}/api/v1/applicants",
                json={
                    "first_name": "TestCompany",
                    "last_name": f"User_{int(time.time())}",
                    "email": f"test_{int(time.time())}@test.com",
                    "phone": "555-1111",
                    "address": "111 Test St",
                    "city": "Test City",
                    "state": "CA",
                    "zip": "90210",
                    "annual_income": 50000,
                    "household_size": 1,
                    "credit_score": 700
                },
                headers=headers1
            )
            
            if resp.status_code in [200, 201]:
                # Now login as different company user
                resp2 = self.session.post(
                    f"{BACKEND_URL}/api/v1/auth/login",
                    json={"email": "admin@demo.com", "password": "password123"}
                )
                
                if resp2.status_code == 200:
                    token2 = resp2.json().get("access_token")
                    headers2 = {"Authorization": f"Bearer {token2}"}
                    
                    # Check if demo company can see test company data
                    resp = self.session.get(f"{BACKEND_URL}/api/v1/applicants", headers=headers2)
                    if resp.status_code == 200:
                        demo_applicants = resp.json()
                        
                        # Check for data leakage
                        test_company_data = [a for a in demo_applicants 
                                           if "TestCompany" in a.get("first_name", "")]
                        
                        if test_company_data:
                            self.log("Data Isolation", "FAIL", 
                                    f"Demo company can see {len(test_company_data)} test company records!")
                        else:
                            self.log("Data Isolation", "PASS", 
                                    "Companies cannot see each other's data")
                else:
                    self.log("Data Isolation", "SKIP", "Could not login as demo company")
            else:
                self.log("Data Isolation", "SKIP", "Could not create test data")
        else:
            self.log("Data Isolation", "SKIP", "Could not login as test company")
            
    def save_results(self):
        """Save test results"""
        summary = {
            "total": len(self.results),
            "passed": len([r for r in self.results if r["status"] == "PASS"]),
            "failed": len([r for r in self.results if r["status"] == "FAIL"]),
            "skipped": len([r for r in self.results if r["status"] == "SKIP"])
        }
        
        with open("functionality_test_results.json", "w") as f:
            json.dump({
                "test_run": datetime.now().isoformat(),
                "results": self.results,
                "summary": summary
            }, f, indent=2)
            
        return summary

def main():
    print("🧪 Testing HomeVerse Complete Functionality")
    print("=" * 50)
    
    tester = FunctionalityTester()
    
    # Check servers
    print("\n📡 Checking Servers")
    print("-" * 40)
    if not tester.test_servers_running():
        print("\n❌ Servers not running properly. Please ensure both are started:")
        print("   Backend: python3 supabase_backend.py")
        print("   Frontend: cd frontend && npm run dev")
        return
        
    # Test backend auth
    print("\n🔐 Testing Backend Authentication")
    print("-" * 40)
    token = tester.test_backend_auth_flow()
    
    # Test CRUD operations
    print("\n📝 Testing CRUD Operations")
    print("-" * 40)
    applicant_id = tester.test_applicant_crud(token)
    project_id = tester.test_project_crud(token)
    
    # Test frontend integration
    print("\n🌐 Testing Frontend Integration")
    print("-" * 40)
    tester.test_frontend_auth_integration()
    
    # Test data isolation
    print("\n🔒 Testing Data Isolation")
    print("-" * 40)
    tester.test_data_isolation()
    
    # Summary
    summary = tester.save_results()
    print("\n📊 Test Summary")
    print("=" * 50)
    print(f"Total Tests: {summary['total']}")
    print(f"✅ Passed: {summary['passed']}")
    print(f"❌ Failed: {summary['failed']}")
    print(f"⏭️  Skipped: {summary['skipped']}")
    print(f"\nDetailed results saved to: functionality_test_results.json")

if __name__ == "__main__":
    main()