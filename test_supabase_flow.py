#!/usr/bin/env python3
"""
Test Supabase backend functionality and data isolation
"""

import requests
import json
from datetime import datetime
import time
import random

BASE_URL = "http://localhost:8000"

class SupabaseFlowTester:
    def __init__(self):
        self.results = []
        self.tokens = {}
        self.created_data = {}
        
    def log(self, test, status, details=""):
        result = {
            "test": test,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        print(f"{'✅' if status == 'PASS' else '❌ ' if status == 'FAIL' else '⏭️ '} {test}: {details}")
        
    def test_health(self):
        """Test backend health"""
        try:
            resp = requests.get(f"{BASE_URL}/health")
            if resp.status_code == 200:
                data = resp.json()
                self.log("Backend Health", "PASS", f"Status: {data.get('status')}, DB: {data.get('database')}")
                return True
            else:
                self.log("Backend Health", "FAIL", f"Status code: {resp.status_code}")
                return False
        except Exception as e:
            self.log("Backend Health", "FAIL", str(e))
            return False
            
    def register_test_user(self, company_key, role="developer"):
        """Register a new test user"""
        email = f"test_{company_key}_{int(time.time())}_{random.randint(1000,9999)}@example.com"
        user_data = {
            "email": email,
            "password": "TestPassword123!",
            "full_name": f"Test User {company_key}",
            "role": role,
            "company_key": company_key
        }
        
        try:
            resp = requests.post(f"{BASE_URL}/api/v1/auth/register", json=user_data)
            if resp.status_code == 200:
                data = resp.json()
                self.log(f"Register User - {company_key}", "PASS", 
                        f"Created: {email} with role {role}")
                return email, "TestPassword123!"
            else:
                self.log(f"Register User - {company_key}", "FAIL", 
                        f"Status: {resp.status_code}, Error: {resp.text}")
                return None, None
        except Exception as e:
            self.log(f"Register User - {company_key}", "FAIL", str(e))
            return None, None
            
    def login_user(self, email, password, company_name=""):
        """Login a user and store token"""
        try:
            resp = requests.post(f"{BASE_URL}/api/v1/auth/login", 
                               json={"email": email, "password": password})
            
            if resp.status_code == 200:
                data = resp.json()
                token = data.get("access_token")
                user_info = data.get("user", {})
                
                self.tokens[company_name or email] = token
                self.log(f"Login - {company_name or email}", "PASS", 
                        f"User: {user_info.get('email')}, Role: {user_info.get('role')}")
                return token, user_info
            else:
                self.log(f"Login - {company_name or email}", "FAIL", 
                        f"Status: {resp.status_code}")
                return None, None
        except Exception as e:
            self.log(f"Login - {company_name or email}", "FAIL", str(e))
            return None, None
            
    def create_applicant(self, token, company_name):
        """Create an applicant"""
        applicant_data = {
            "full_name": f"Test Applicant {company_name} {int(time.time())}",
            "email": f"applicant_{company_name}_{int(time.time())}@test.com",
            "phone": "555-0100",
            "income": 75000,
            "household_size": 3,
            "preferences": {
                "location": f"{company_name} Area",
                "max_rent": 2000
            }
        }
        
        try:
            headers = {"Authorization": f"Bearer {token}"}
            resp = requests.post(f"{BASE_URL}/api/v1/applicants", 
                               json=applicant_data, headers=headers)
            
            if resp.status_code in [200, 201]:
                data = resp.json()
                if company_name not in self.created_data:
                    self.created_data[company_name] = {"applicants": [], "projects": []}
                self.created_data[company_name]["applicants"].append(data)
                
                self.log(f"Create Applicant - {company_name}", "PASS", 
                        f"Created: {data.get('full_name')} (ID: {data.get('id')})")
                return data.get("id")
            else:
                self.log(f"Create Applicant - {company_name}", "FAIL", 
                        f"Status: {resp.status_code}, Error: {resp.text}")
                return None
        except Exception as e:
            self.log(f"Create Applicant - {company_name}", "FAIL", str(e))
            return None
            
    def create_project(self, token, company_name):
        """Create a project"""
        project_data = {
            "name": f"Test Project {company_name} {int(time.time())}",
            "description": f"Test project for {company_name}",
            "location": f"{company_name} City",
            "coordinates": [34.0522, -118.2437],
            "total_units": 100,
            "available_units": 30,
            "ami_percentage": 80,
            "amenities": ["parking", "laundry"]
        }
        
        try:
            headers = {"Authorization": f"Bearer {token}"}
            resp = requests.post(f"{BASE_URL}/api/v1/projects", 
                               json=project_data, headers=headers)
            
            if resp.status_code in [200, 201]:
                data = resp.json()
                if company_name not in self.created_data:
                    self.created_data[company_name] = {"applicants": [], "projects": []}
                self.created_data[company_name]["projects"].append(data)
                
                self.log(f"Create Project - {company_name}", "PASS", 
                        f"Created: {data.get('name')} (ID: {data.get('id')})")
                return data.get("id")
            else:
                self.log(f"Create Project - {company_name}", "FAIL", 
                        f"Status: {resp.status_code}, Error: {resp.text}")
                return None
        except Exception as e:
            self.log(f"Create Project - {company_name}", "FAIL", str(e))
            return None
            
    def list_entities(self, token, entity_type, company_name):
        """List applicants or projects"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            resp = requests.get(f"{BASE_URL}/api/v1/{entity_type}", headers=headers)
            
            if resp.status_code == 200:
                data = resp.json()
                count = len(data) if isinstance(data, list) else 0
                self.log(f"List {entity_type.title()} - {company_name}", "PASS", 
                        f"Found {count} {entity_type}")
                return data
            else:
                self.log(f"List {entity_type.title()} - {company_name}", "FAIL", 
                        f"Status: {resp.status_code}")
                return []
        except Exception as e:
            self.log(f"List {entity_type.title()} - {company_name}", "FAIL", str(e))
            return []
            
    def test_data_isolation(self):
        """Test that companies can't see each other's data"""
        if len(self.tokens) < 2:
            self.log("Data Isolation Test", "SKIP", "Need at least 2 companies to test")
            return
            
        companies = list(self.tokens.keys())
        
        for i, company in enumerate(companies):
            token = self.tokens[company]
            
            # List applicants
            applicants = self.list_entities(token, "applicants", company)
            
            # Check for data leakage
            other_companies = [c for c in companies if c != company]
            leaked_data = []
            
            for applicant in applicants:
                name = applicant.get("full_name", "")
                for other_company in other_companies:
                    if other_company in name:
                        leaked_data.append((other_company, applicant))
                        
            if leaked_data:
                self.log(f"Data Isolation - {company}", "FAIL", 
                        f"Can see {len(leaked_data)} records from other companies!")
                for other_company, record in leaked_data[:2]:  # Show first 2
                    print(f"  ⚠️  Leaked: {record.get('full_name')} from {other_company}")
            else:
                own_data = [a for a in applicants if company in a.get("full_name", "")]
                self.log(f"Data Isolation - {company}", "PASS", 
                        f"Only sees own data ({len(own_data)} records)")
                        
    def run_full_test(self):
        """Run complete test suite"""
        print("🧪 Testing Supabase Backend Functionality")
        print("=" * 50)
        
        # Test health
        if not self.test_health():
            print("\n❌ Backend not healthy. Aborting tests.")
            return
            
        print("\n📝 Creating Test Users and Data")
        print("-" * 40)
        
        # Test with two different companies
        companies = ["alpha", "beta"]
        
        for company in companies:
            print(f"\n🏢 Testing Company: {company}")
            
            # Register and login
            email, password = self.register_test_user(company, "developer")
            
            if email:
                token, user_info = self.login_user(email, password, company)
                
                if token:
                    # Create test data
                    for i in range(2):
                        self.create_applicant(token, company)
                    
                    self.create_project(token, company)
            else:
                # Try with existing test accounts if registration fails
                print(f"  ℹ️  Registration failed, trying existing account...")
                if company == "alpha":
                    token, user_info = self.login_user("developer@test.com", "password123", company)
                elif company == "beta":
                    token, user_info = self.login_user("admin@demo.com", "password123", company)
                    
                if token:
                    self.tokens[company] = token
                    # Create test data
                    self.create_applicant(token, company)
                    self.create_project(token, company)
                    
        print("\n🔒 Testing Data Isolation")
        print("-" * 40)
        self.test_data_isolation()
        
        # Summary
        self.save_results()
        
    def save_results(self):
        """Save and display results"""
        summary = {
            "total": len(self.results),
            "passed": len([r for r in self.results if r["status"] == "PASS"]),
            "failed": len([r for r in self.results if r["status"] == "FAIL"]),
            "skipped": len([r for r in self.results if r["status"] == "SKIP"])
        }
        
        with open("supabase_test_results.json", "w") as f:
            json.dump({
                "test_run": datetime.now().isoformat(),
                "results": self.results,
                "created_data": self.created_data,
                "summary": summary
            }, f, indent=2)
            
        print("\n📊 Test Summary")
        print("=" * 50)
        print(f"Total Tests: {summary['total']}")
        print(f"✅ Passed: {summary['passed']}")
        print(f"❌ Failed: {summary['failed']}")
        print(f"⏭️  Skipped: {summary['skipped']}")
        print(f"\nDetailed results saved to: supabase_test_results.json")

if __name__ == "__main__":
    tester = SupabaseFlowTester()
    tester.run_full_test()