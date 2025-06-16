#!/usr/bin/env python3
"""
Comprehensive functionality test for HomeVerse application
Tests all major features of the Supabase backend
"""

import asyncio
import json
import sys
from typing import Dict, Any, Optional
import httpx
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
TEST_ACCOUNTS = {
    "developer": {"email": "developer@test.com", "password": "password123"},
    "lender": {"email": "lender@test.com", "password": "password123"},
    "buyer": {"email": "buyer@test.com", "password": "password123"},
    "applicant": {"email": "applicant@test.com", "password": "password123"},
    "admin": {"email": "admin@test.com", "password": "password123"}
}

class TestRunner:
    def __init__(self):
        self.client = httpx.AsyncClient(base_url=BASE_URL, timeout=30.0)
        self.tokens: Dict[str, str] = {}
        self.test_results = []
        
    async def close(self):
        await self.client.aclose()
        
    def log_result(self, test_name: str, success: bool, details: str = ""):
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details and not success:
            print(f"    Details: {details}")
            
    async def test_health_check(self):
        """Test if backend is running"""
        try:
            response = await self.client.get("/health")
            success = response.status_code == 200
            self.log_result("Health Check", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_result("Health Check", False, str(e))
            return False
            
    async def test_authentication(self):
        """Test login for all user roles"""
        for role, credentials in TEST_ACCOUNTS.items():
            try:
                response = await self.client.post("/api/v1/auth/login", json=credentials)
                if response.status_code == 200:
                    data = response.json()
                    self.tokens[role] = data.get("access_token", "")
                    self.log_result(f"Login - {role}", True)
                else:
                    self.log_result(f"Login - {role}", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result(f"Login - {role}", False, str(e))
                
    async def test_user_profile(self):
        """Test getting user profile"""
        for role, token in self.tokens.items():
            try:
                headers = {"Authorization": f"Bearer {token}"}
                response = await self.client.get("/api/v1/auth/me", headers=headers)
                success = response.status_code == 200
                self.log_result(f"Get Profile - {role}", success)
            except Exception as e:
                self.log_result(f"Get Profile - {role}", False, str(e))
                
    async def test_applicant_crud(self):
        """Test applicant CRUD operations"""
        if "developer" not in self.tokens:
            self.log_result("Applicant CRUD", False, "No developer token")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['developer']}"}
        
        # Create applicant
        applicant_data = {
            "first_name": "Test",
            "last_name": "Applicant",
            "email": "test.applicant@example.com",
            "phone": "+1234567890",
            "household_size": 3,
            "household_income": 50000,
            "desired_location": {"lat": 40.7128, "lng": -74.0060},
            "max_rent": 2000,
            "min_bedrooms": 2,
            "preferences": {"pet_friendly": True}
        }
        
        try:
            # Create
            response = await self.client.post("/api/v1/applicants", json=applicant_data, headers=headers)
            if response.status_code == 201:
                applicant_id = response.json()["id"]
                self.log_result("Create Applicant", True)
                
                # Read
                response = await self.client.get(f"/api/v1/applicants/{applicant_id}", headers=headers)
                self.log_result("Read Applicant", response.status_code == 200)
                
                # Update
                update_data = {"first_name": "Updated"}
                response = await self.client.patch(f"/api/v1/applicants/{applicant_id}", json=update_data, headers=headers)
                self.log_result("Update Applicant", response.status_code == 200)
                
                # List
                response = await self.client.get("/api/v1/applicants", headers=headers)
                self.log_result("List Applicants", response.status_code == 200)
                
                # Delete
                response = await self.client.delete(f"/api/v1/applicants/{applicant_id}", headers=headers)
                self.log_result("Delete Applicant", response.status_code == 204)
            else:
                self.log_result("Create Applicant", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Applicant CRUD", False, str(e))
            
    async def test_project_management(self):
        """Test project CRUD operations"""
        if "developer" not in self.tokens:
            self.log_result("Project Management", False, "No developer token")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['developer']}"}
        
        project_data = {
            "name": "Test Affordable Housing",
            "developer_name": "Test Developer LLC",
            "total_units": 100,
            "affordable_units": 30,
            "ami_percentage": 80,
            "location": {"lat": 40.7589, "lng": -73.9851},
            "amenities": ["parking", "gym", "laundry"],
            "expected_completion": "2025-12-31",
            "application_deadline": "2025-06-30"
        }
        
        try:
            # Create
            response = await self.client.post("/api/v1/projects", json=project_data, headers=headers)
            if response.status_code == 201:
                project_id = response.json()["id"]
                self.log_result("Create Project", True)
                
                # Read
                response = await self.client.get(f"/api/v1/projects/{project_id}", headers=headers)
                self.log_result("Read Project", response.status_code == 200)
                
                # Update
                update_data = {"name": "Updated Project Name"}
                response = await self.client.patch(f"/api/v1/projects/{project_id}", json=update_data, headers=headers)
                self.log_result("Update Project", response.status_code == 200)
                
                # List
                response = await self.client.get("/api/v1/projects", headers=headers)
                self.log_result("List Projects", response.status_code == 200)
                
                # Delete
                response = await self.client.delete(f"/api/v1/projects/{project_id}", headers=headers)
                self.log_result("Delete Project", response.status_code == 204)
            else:
                self.log_result("Create Project", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Project Management", False, str(e))
            
    async def test_contact_form(self):
        """Test contact form submission"""
        contact_data = {
            "name": "Test User",
            "email": "test@example.com",
            "company": "Test Company",
            "role": "Developer",
            "message": "This is a test message"
        }
        
        try:
            # Backend expects form data, not JSON
            response = await self.client.post("/api/v1/contact", data=contact_data)
            success = response.status_code == 201
            self.log_result("Contact Form Submission", success)
        except Exception as e:
            self.log_result("Contact Form Submission", False, str(e))
            
    async def test_map_data(self):
        """Test map/heatmap data endpoint"""
        if "lender" not in self.tokens:
            self.log_result("Map Data", False, "No lender token")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['lender']}"}
        
        try:
            response = await self.client.get("/api/v1/analytics/heatmap", headers=headers)
            success = response.status_code == 200
            self.log_result("Get Heatmap Data", success)
        except Exception as e:
            self.log_result("Get Heatmap Data", False, str(e))
            
    async def test_settings_endpoints(self):
        """Test user settings and preferences"""
        if "developer" not in self.tokens:
            self.log_result("Settings", False, "No developer token")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['developer']}"}
        
        try:
            # Get settings
            response = await self.client.get("/api/v1/users/settings", headers=headers)
            self.log_result("Get User Settings", response.status_code == 200)
            
            # Update settings
            settings_data = {
                "notifications": {
                    "email_new_applications": True,
                    "email_status_updates": False
                }
            }
            response = await self.client.patch("/api/v1/users/settings", json=settings_data, headers=headers)
            self.log_result("Update User Settings", response.status_code == 200)
        except Exception as e:
            self.log_result("Settings Endpoints", False, str(e))
            
    async def run_all_tests(self):
        """Run all tests in sequence"""
        print("\n🚀 Starting HomeVerse Functionality Tests\n")
        print("=" * 50)
        
        # Check if backend is running
        if not await self.test_health_check():
            print("\n❌ Backend is not running! Please start it with: python3 supabase_backend.py")
            return
            
        print("\n📋 Running Tests...\n")
        
        # Run tests
        await self.test_authentication()
        print()
        await self.test_user_profile()
        print()
        await self.test_applicant_crud()
        print()
        await self.test_project_management()
        print()
        await self.test_contact_form()
        print()
        await self.test_map_data()
        print()
        await self.test_settings_endpoints()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 Test Summary\n")
        
        passed = sum(1 for r in self.test_results if r["success"])
        failed = sum(1 for r in self.test_results if not r["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed} ✅")
        print(f"Failed: {failed} ❌")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        # Save results
        with open("test_results.json", "w") as f:
            json.dump(self.test_results, f, indent=2)
        print("\n💾 Detailed results saved to test_results.json")
        
        # List failed tests
        if failed > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")

async def main():
    runner = TestRunner()
    try:
        await runner.run_all_tests()
    finally:
        await runner.close()

if __name__ == "__main__":
    asyncio.run(main())