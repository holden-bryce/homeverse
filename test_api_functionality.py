#!/usr/bin/env python3
"""
Test HomeVerse API functionality directly
Tests authentication, data creation, and company isolation
"""

import requests
import json
from datetime import datetime
import time

# Base URL
BASE_URL = "http://localhost:8000"

# Test accounts
TEST_ACCOUNTS = [
    {
        "email": "developer@test.com",
        "password": "password123",
        "company": "test"
    },
    {
        "email": "admin@demo.com",
        "password": "password123",
        "company": "demo"
    }
]

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.results = []
        self.data_by_company = {}
        
    def add_result(self, test_name, status, details=""):
        self.results.append({
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        print(f"{'✅' if status == 'PASS' else '❌'} {test_name}: {details}")
        
    def test_health(self):
        """Test backend health endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                self.add_result("Backend Health", "PASS", "Backend is running")
                return True
            else:
                self.add_result("Backend Health", "FAIL", f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.add_result("Backend Health", "FAIL", str(e))
            return False
            
    def test_login(self, email, password):
        """Test login functionality"""
        try:
            # Clear session
            self.session = requests.Session()
            
            # Login
            response = self.session.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": email, "password": password}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.add_result(
                    f"Login - {email}", 
                    "PASS", 
                    f"User: {data.get('user', {}).get('email', 'Unknown')}"
                )
                return data.get("access_token")
            else:
                self.add_result(
                    f"Login - {email}", 
                    "FAIL", 
                    f"Status: {response.status_code}, Error: {response.text}"
                )
                return None
        except Exception as e:
            self.add_result(f"Login - {email}", "FAIL", str(e))
            return None
            
    def test_create_applicant(self, token, company_name):
        """Test creating an applicant"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            
            # Create unique applicant data
            applicant_data = {
                "first_name": f"Test_{company_name}",
                "last_name": f"User_{int(time.time())}",
                "email": f"test_{company_name}_{int(time.time())}@example.com",
                "phone": "555-0123",
                "address": "123 Test Street",
                "city": "Test City",
                "state": "CA",
                "zip": "90210",
                "annual_income": 50000,
                "household_size": 2,
                "credit_score": 700,
                "preferences": {
                    "location": "Downtown",
                    "max_rent": 2000
                }
            }
            
            response = self.session.post(
                f"{BASE_URL}/api/applicants",
                json=applicant_data,
                headers=headers
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.add_result(
                    f"Create Applicant - {company_name}",
                    "PASS",
                    f"Created: {data.get('first_name')} {data.get('last_name')} (ID: {data.get('id')})"
                )
                
                # Store for isolation testing
                if company_name not in self.data_by_company:
                    self.data_by_company[company_name] = {"applicants": [], "projects": []}
                self.data_by_company[company_name]["applicants"].append(data)
                
                return data.get("id")
            else:
                self.add_result(
                    f"Create Applicant - {company_name}",
                    "FAIL",
                    f"Status: {response.status_code}, Error: {response.text}"
                )
                return None
        except Exception as e:
            self.add_result(f"Create Applicant - {company_name}", "FAIL", str(e))
            return None
            
    def test_list_applicants(self, token, company_name):
        """Test listing applicants"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            
            response = self.session.get(
                f"{BASE_URL}/api/applicants",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                count = len(data) if isinstance(data, list) else 0
                self.add_result(
                    f"List Applicants - {company_name}",
                    "PASS",
                    f"Found {count} applicants"
                )
                return data
            else:
                self.add_result(
                    f"List Applicants - {company_name}",
                    "FAIL",
                    f"Status: {response.status_code}"
                )
                return []
        except Exception as e:
            self.add_result(f"List Applicants - {company_name}", "FAIL", str(e))
            return []
            
    def test_create_project(self, token, company_name):
        """Test creating a project"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            
            # Create unique project data
            project_data = {
                "name": f"Test Project {company_name} {int(time.time())}",
                "address": "456 Project Ave",
                "city": "Project City",
                "state": "CA",
                "zip": "90211",
                "latitude": 34.0522,
                "longitude": -118.2437,
                "total_units": 100,
                "affordable_units": 30,
                "ami_percentage": 80,
                "status": "planning",
                "description": f"Test project for {company_name} company"
            }
            
            response = self.session.post(
                f"{BASE_URL}/api/projects",
                json=project_data,
                headers=headers
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.add_result(
                    f"Create Project - {company_name}",
                    "PASS",
                    f"Created: {data.get('name')} (ID: {data.get('id')})"
                )
                
                # Store for isolation testing
                if company_name not in self.data_by_company:
                    self.data_by_company[company_name] = {"applicants": [], "projects": []}
                self.data_by_company[company_name]["projects"].append(data)
                
                return data.get("id")
            else:
                self.add_result(
                    f"Create Project - {company_name}",
                    "FAIL",
                    f"Status: {response.status_code}, Error: {response.text}"
                )
                return None
        except Exception as e:
            self.add_result(f"Create Project - {company_name}", "FAIL", str(e))
            return None
            
    def test_data_isolation(self):
        """Test that data is properly isolated between companies"""
        try:
            # Check if we have data from multiple companies
            if len(self.data_by_company) < 2:
                self.add_result(
                    "Data Isolation",
                    "SKIP",
                    "Need data from at least 2 companies to test isolation"
                )
                return
                
            # Login as each company and verify they only see their own data
            for account in TEST_ACCOUNTS:
                token = self.test_login(account["email"], account["password"])
                if token:
                    # Get applicants for this company
                    applicants = self.test_list_applicants(token, account["company"])
                    
                    # Check that all applicants belong to this company
                    # by verifying the first_name contains the company name
                    own_data_count = 0
                    other_data_count = 0
                    
                    for applicant in applicants:
                        if account["company"] in applicant.get("first_name", ""):
                            own_data_count += 1
                        elif any(other_company in applicant.get("first_name", "") 
                               for other_company in self.data_by_company.keys() 
                               if other_company != account["company"]):
                            other_data_count += 1
                            
                    if other_data_count > 0:
                        self.add_result(
                            f"Data Isolation - {account['company']}",
                            "FAIL",
                            f"Found {other_data_count} records from other companies!"
                        )
                    else:
                        self.add_result(
                            f"Data Isolation - {account['company']}",
                            "PASS",
                            f"Only seeing own data ({own_data_count} records)"
                        )
                        
        except Exception as e:
            self.add_result("Data Isolation", "FAIL", str(e))
            
    def save_results(self):
        """Save test results to file"""
        summary = {
            "total": len(self.results),
            "passed": len([r for r in self.results if r["status"] == "PASS"]),
            "failed": len([r for r in self.results if r["status"] == "FAIL"]),
            "skipped": len([r for r in self.results if r["status"] == "SKIP"])
        }
        
        with open("api_test_results.json", "w") as f:
            json.dump({
                "results": self.results,
                "data_created": self.data_by_company,
                "summary": summary
            }, f, indent=2)
            
        return summary

def main():
    """Run all API tests"""
    print("🧪 Testing HomeVerse API Functionality")
    print("=" * 50)
    
    tester = APITester()
    
    # Test backend health
    if not tester.test_health():
        print("❌ Backend is not running. Please start it first.")
        return
        
    print("\n📝 Testing Authentication and Data Creation")
    print("-" * 40)
    
    # Test each account
    for account in TEST_ACCOUNTS:
        print(f"\n🔑 Testing account: {account['email']}")
        
        # Login
        token = tester.test_login(account["email"], account["password"])
        
        if token:
            # Create applicant
            applicant_id = tester.test_create_applicant(token, account["company"])
            
            # Create project (only for developer role accounts)
            if "developer" in account["email"] or "admin" in account["email"]:
                project_id = tester.test_create_project(token, account["company"])
                
    print("\n🔒 Testing Data Isolation")
    print("-" * 40)
    tester.test_data_isolation()
    
    # Save and display results
    summary = tester.save_results()
    
    print("\n📊 Test Summary")
    print("=" * 50)
    print(f"Total Tests: {summary['total']}")
    print(f"✅ Passed: {summary['passed']}")
    print(f"❌ Failed: {summary['failed']}")
    print(f"⏭️  Skipped: {summary['skipped']}")
    print(f"\nDetailed results saved to: api_test_results.json")

if __name__ == "__main__":
    main()