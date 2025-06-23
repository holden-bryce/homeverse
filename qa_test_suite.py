#!/usr/bin/env python3
"""
Comprehensive QA Test Suite for HomeVerse Platform
Tests all functionality across all user roles
"""
import requests
import json
import time
from datetime import datetime
import os
from typing import Dict, List, Tuple
import sys

# Base URLs
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

# Test credentials
TEST_USERS = {
    "developer": {"email": "developer@test.com", "password": "password123"},
    "lender": {"email": "lender@test.com", "password": "password123"},
    "buyer": {"email": "buyer@test.com", "password": "password123"},
    "applicant": {"email": "applicant@test.com", "password": "password123"},
    "admin": {"email": "admin@test.com", "password": "password123"}
}

# Colors for output
RED = '\033[91m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

class QATester:
    def __init__(self):
        self.results = {
            "passed": 0,
            "failed": 0,
            "warnings": 0,
            "tests": []
        }
        self.tokens = {}
        self.test_data = {}
        
    def log_test(self, test_name: str, status: str, details: str = ""):
        """Log test result"""
        color = GREEN if status == "PASS" else RED if status == "FAIL" else YELLOW
        print(f"{color}[{status}]{RESET} {test_name}")
        if details:
            print(f"      {details}")
        
        self.results["tests"].append({
            "name": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        
        if status == "PASS":
            self.results["passed"] += 1
        elif status == "FAIL":
            self.results["failed"] += 1
        else:
            self.results["warnings"] += 1
    
    def test_health_check(self):
        """Test backend health endpoint"""
        try:
            response = requests.get(f"{BASE_URL}/health")
            if response.status_code == 200 and response.json()["status"] == "healthy":
                self.log_test("Backend Health Check", "PASS", "Backend is healthy")
            else:
                self.log_test("Backend Health Check", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Backend Health Check", "FAIL", str(e))
    
    def test_authentication(self):
        """Test authentication for all user roles"""
        print(f"\n{BLUE}=== Testing Authentication ==={RESET}")
        
        for role, creds in TEST_USERS.items():
            try:
                response = requests.post(
                    f"{BASE_URL}/api/v1/auth/login",
                    json=creds
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.tokens[role] = data["access_token"]
                    self.log_test(f"Login: {role}", "PASS", f"User: {creds['email']}")
                    
                    # Test current user endpoint
                    headers = {"Authorization": f"Bearer {self.tokens[role]}"}
                    user_response = requests.get(f"{BASE_URL}/api/v1/auth/me", headers=headers)
                    
                    if user_response.status_code == 200:
                        user_data = user_response.json()
                        if user_data["role"] == role:
                            self.log_test(f"Get Current User: {role}", "PASS")
                        else:
                            self.log_test(f"Get Current User: {role}", "FAIL", f"Role mismatch: expected {role}, got {user_data['role']}")
                    else:
                        self.log_test(f"Get Current User: {role}", "FAIL", f"Status: {user_response.status_code}")
                else:
                    self.log_test(f"Login: {role}", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test(f"Login: {role}", "FAIL", str(e))
    
    def test_applicant_management(self):
        """Test CRUD operations for applicants"""
        print(f"\n{BLUE}=== Testing Applicant Management ==={RESET}")
        
        if "developer" not in self.tokens:
            self.log_test("Applicant Management", "SKIP", "No developer token available")
            return
        
        headers = {"Authorization": f"Bearer {self.tokens['developer']}"}
        
        # Create applicant
        test_applicant = {
            "first_name": "QA",
            "last_name": "Test",
            "email": f"qa_test_{int(time.time())}@example.com",
            "phone": "555-0123",
            "income": 75000,
            "household_size": 2,
            "desired_location": {"lat": 37.7749, "lng": -122.4194},
            "max_rent": 2500,
            "preferences": {
                "min_bedrooms": 2,
                "accessibility": False,
                "pet_friendly": True
            }
        }
        
        try:
            # Create
            response = requests.post(
                f"{BASE_URL}/api/v1/applicants",
                json=test_applicant,
                headers=headers
            )
            
            if response.status_code == 200:
                applicant = response.json()
                self.test_data["applicant_id"] = applicant["id"]
                self.log_test("Create Applicant", "PASS", f"ID: {applicant['id']}")
                
                # Read
                get_response = requests.get(
                    f"{BASE_URL}/api/v1/applicants/{applicant['id']}",
                    headers=headers
                )
                
                if get_response.status_code == 200:
                    self.log_test("Get Applicant", "PASS")
                else:
                    self.log_test("Get Applicant", "FAIL", f"Status: {get_response.status_code}")
                
                # Update
                update_data = {"phone": "555-9999"}
                update_response = requests.put(
                    f"{BASE_URL}/api/v1/applicants/{applicant['id']}",
                    json=update_data,
                    headers=headers
                )
                
                if update_response.status_code == 200:
                    self.log_test("Update Applicant", "PASS")
                else:
                    self.log_test("Update Applicant", "FAIL", f"Status: {update_response.status_code}")
                
                # List
                list_response = requests.get(
                    f"{BASE_URL}/api/v1/applicants",
                    headers=headers
                )
                
                if list_response.status_code == 200:
                    applicants = list_response.json()
                    if any(a["id"] == applicant["id"] for a in applicants):
                        self.log_test("List Applicants", "PASS", f"Found {len(applicants)} applicants")
                    else:
                        self.log_test("List Applicants", "FAIL", "Created applicant not in list")
                else:
                    self.log_test("List Applicants", "FAIL", f"Status: {list_response.status_code}")
                    
            else:
                self.log_test("Create Applicant", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Applicant Management", "FAIL", str(e))
    
    def test_project_management(self):
        """Test CRUD operations for projects"""
        print(f"\n{BLUE}=== Testing Project Management ==={RESET}")
        
        if "developer" not in self.tokens:
            self.log_test("Project Management", "SKIP", "No developer token available")
            return
        
        headers = {"Authorization": f"Bearer {self.tokens['developer']}"}
        
        # Create project
        test_project = {
            "name": f"QA Test Project {int(time.time())}",
            "description": "Automated QA test project",
            "location": {"lat": 37.7749, "lng": -122.4194},
            "total_units": 50,
            "affordable_units": 15,
            "ami_levels": [30, 50, 80],
            "status": "planning",
            "timeline": {
                "construction_start": "2025-01-01",
                "expected_completion": "2026-06-01"
            }
        }
        
        try:
            # Create
            response = requests.post(
                f"{BASE_URL}/api/v1/projects",
                json=test_project,
                headers=headers
            )
            
            if response.status_code == 200:
                project = response.json()
                self.test_data["project_id"] = project["id"]
                self.log_test("Create Project", "PASS", f"ID: {project['id']}")
                
                # Read
                get_response = requests.get(
                    f"{BASE_URL}/api/v1/projects/{project['id']}",
                    headers=headers
                )
                
                if get_response.status_code == 200:
                    self.log_test("Get Project", "PASS")
                else:
                    self.log_test("Get Project", "FAIL", f"Status: {get_response.status_code}")
                
                # Update
                update_data = {"status": "approved"}
                update_response = requests.put(
                    f"{BASE_URL}/api/v1/projects/{project['id']}",
                    json=update_data,
                    headers=headers
                )
                
                if update_response.status_code == 200:
                    self.log_test("Update Project", "PASS")
                else:
                    self.log_test("Update Project", "FAIL", f"Status: {update_response.status_code}")
                
                # List
                list_response = requests.get(
                    f"{BASE_URL}/api/v1/projects",
                    headers=headers
                )
                
                if list_response.status_code == 200:
                    projects = list_response.json()
                    if any(p["id"] == project["id"] for p in projects):
                        self.log_test("List Projects", "PASS", f"Found {len(projects)} projects")
                    else:
                        self.log_test("List Projects", "FAIL", "Created project not in list")
                else:
                    self.log_test("List Projects", "FAIL", f"Status: {list_response.status_code}")
                    
            else:
                self.log_test("Create Project", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Project Management", "FAIL", str(e))
    
    def test_application_workflow(self):
        """Test application submission workflow"""
        print(f"\n{BLUE}=== Testing Application Workflow ==={RESET}")
        
        if "buyer" not in self.tokens:
            self.log_test("Application Workflow", "SKIP", "No buyer token available")
            return
        
        if "project_id" not in self.test_data:
            self.log_test("Application Workflow", "SKIP", "No test project available")
            return
        
        headers = {"Authorization": f"Bearer {self.tokens['buyer']}"}
        
        # Create application
        test_application = {
            "project_id": self.test_data["project_id"],
            "unit_type": "2BR",
            "documents": {
                "income_verification": "test_income.pdf",
                "id_proof": "test_id.pdf"
            },
            "message": "QA test application"
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/v1/applications",
                json=test_application,
                headers=headers
            )
            
            if response.status_code == 200:
                application = response.json()
                self.log_test("Submit Application", "PASS", f"ID: {application['id']}")
                
                # Get application status
                status_response = requests.get(
                    f"{BASE_URL}/api/v1/applications/{application['id']}",
                    headers=headers
                )
                
                if status_response.status_code == 200:
                    self.log_test("Get Application Status", "PASS")
                else:
                    self.log_test("Get Application Status", "FAIL", f"Status: {status_response.status_code}")
                    
            else:
                self.log_test("Submit Application", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Application Workflow", "FAIL", str(e))
    
    def test_investment_functionality(self):
        """Test investment operations"""
        print(f"\n{BLUE}=== Testing Investment Functionality ==={RESET}")
        
        if "lender" not in self.tokens:
            self.log_test("Investment Functionality", "SKIP", "No lender token available")
            return
        
        if "project_id" not in self.test_data:
            self.log_test("Investment Functionality", "SKIP", "No test project available")
            return
        
        headers = {"Authorization": f"Bearer {self.tokens['lender']}"}
        
        # Create investment
        test_investment = {
            "project_id": self.test_data["project_id"],
            "amount": 500000,
            "investment_type": "construction_loan",
            "terms": {
                "interest_rate": 4.5,
                "duration_months": 24
            }
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/v1/investments",
                json=test_investment,
                headers=headers
            )
            
            if response.status_code == 200:
                investment = response.json()
                self.log_test("Create Investment", "PASS", f"ID: {investment['id']}")
                
                # Get portfolio
                portfolio_response = requests.get(
                    f"{BASE_URL}/api/v1/lenders/portfolio",
                    headers=headers
                )
                
                if portfolio_response.status_code == 200:
                    portfolio = portfolio_response.json()
                    self.log_test("Get Investment Portfolio", "PASS", f"Total investments: {portfolio.get('total_investments', 0)}")
                else:
                    self.log_test("Get Investment Portfolio", "FAIL", f"Status: {portfolio_response.status_code}")
                    
            else:
                self.log_test("Create Investment", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Investment Functionality", "FAIL", str(e))
    
    def test_analytics_endpoints(self):
        """Test analytics and reporting endpoints"""
        print(f"\n{BLUE}=== Testing Analytics ==={RESET}")
        
        # Test developer analytics
        if "developer" in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['developer']}"}
            
            try:
                response = requests.get(
                    f"{BASE_URL}/api/v1/analytics/developer/overview",
                    headers=headers
                )
                
                if response.status_code == 200:
                    self.log_test("Developer Analytics", "PASS")
                else:
                    self.log_test("Developer Analytics", "FAIL", f"Status: {response.status_code}")
                    
            except Exception as e:
                self.log_test("Developer Analytics", "FAIL", str(e))
        
        # Test lender analytics
        if "lender" in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['lender']}"}
            
            try:
                response = requests.get(
                    f"{BASE_URL}/api/v1/analytics/lender/overview",
                    headers=headers
                )
                
                if response.status_code == 200:
                    self.log_test("Lender Analytics", "PASS")
                else:
                    self.log_test("Lender Analytics", "FAIL", f"Status: {response.status_code}")
                    
            except Exception as e:
                self.log_test("Lender Analytics", "FAIL", str(e))
    
    def test_contact_form(self):
        """Test contact form submission"""
        print(f"\n{BLUE}=== Testing Contact Form ==={RESET}")
        
        contact_data = {
            "name": "QA Tester",
            "email": "qa@test.com",
            "subject": "Automated QA Test",
            "message": "This is an automated test of the contact form functionality."
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/v1/contact",
                json=contact_data
            )
            
            if response.status_code == 200:
                self.log_test("Contact Form Submission", "PASS", "Email sent successfully")
            else:
                self.log_test("Contact Form Submission", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Contact Form Submission", "FAIL", str(e))
    
    def test_user_settings(self):
        """Test user settings and profile management"""
        print(f"\n{BLUE}=== Testing User Settings ==={RESET}")
        
        if "developer" not in self.tokens:
            self.log_test("User Settings", "SKIP", "No developer token available")
            return
        
        headers = {"Authorization": f"Bearer {self.tokens['developer']}"}
        
        # Update profile
        profile_data = {
            "full_name": "QA Test Developer",
            "phone": "555-0000",
            "timezone": "America/New_York",
            "language": "en"
        }
        
        try:
            response = requests.put(
                f"{BASE_URL}/api/v1/users/profile",
                json=profile_data,
                headers=headers
            )
            
            if response.status_code == 200:
                self.log_test("Update User Profile", "PASS")
                
                # Update notification preferences
                notif_data = {
                    "email_notifications": True,
                    "sms_notifications": False,
                    "application_updates": True,
                    "investment_alerts": True
                }
                
                notif_response = requests.put(
                    f"{BASE_URL}/api/v1/users/notifications",
                    json=notif_data,
                    headers=headers
                )
                
                if notif_response.status_code == 200:
                    self.log_test("Update Notification Preferences", "PASS")
                else:
                    self.log_test("Update Notification Preferences", "FAIL", f"Status: {notif_response.status_code}")
            else:
                self.log_test("Update User Profile", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("User Settings", "FAIL", str(e))
    
    def test_map_functionality(self):
        """Test map data endpoints"""
        print(f"\n{BLUE}=== Testing Map Functionality ==={RESET}")
        
        if "developer" not in self.tokens:
            self.log_test("Map Functionality", "SKIP", "No developer token available")
            return
        
        headers = {"Authorization": f"Bearer {self.tokens['developer']}"}
        
        try:
            # Get map data
            response = requests.get(
                f"{BASE_URL}/api/v1/map/projects",
                headers=headers,
                params={
                    "bounds": "-122.5,37.7,-122.3,37.8",
                    "filters": json.dumps({"status": ["planning", "approved"]})
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Get Map Projects", "PASS", f"Found {len(data.get('projects', []))} projects")
            else:
                self.log_test("Get Map Projects", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Map Functionality", "FAIL", str(e))
    
    def test_export_functionality(self):
        """Test data export endpoints"""
        print(f"\n{BLUE}=== Testing Export Functionality ==={RESET}")
        
        if "lender" not in self.tokens:
            self.log_test("Export Functionality", "SKIP", "No lender token available")
            return
        
        headers = {"Authorization": f"Bearer {self.tokens['lender']}"}
        
        try:
            # Export portfolio data
            response = requests.get(
                f"{BASE_URL}/api/v1/lenders/portfolio/export",
                headers=headers,
                params={"format": "json"}
            )
            
            if response.status_code == 200:
                self.log_test("Export Portfolio Data", "PASS")
            else:
                self.log_test("Export Portfolio Data", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Export Functionality", "FAIL", str(e))
    
    def generate_report(self):
        """Generate comprehensive QA report"""
        print(f"\n{BLUE}=== QA Test Summary ==={RESET}")
        print(f"Total Tests: {self.results['passed'] + self.results['failed'] + self.results['warnings']}")
        print(f"{GREEN}Passed: {self.results['passed']}{RESET}")
        print(f"{RED}Failed: {self.results['failed']}{RESET}")
        print(f"{YELLOW}Warnings: {self.results['warnings']}{RESET}")
        
        # Calculate pass rate
        total_tests = self.results['passed'] + self.results['failed']
        if total_tests > 0:
            pass_rate = (self.results['passed'] / total_tests) * 100
            print(f"\nPass Rate: {pass_rate:.1f}%")
        
        # Save detailed report
        report = {
            "test_run": datetime.now().isoformat(),
            "summary": self.results,
            "environment": {
                "backend_url": BASE_URL,
                "frontend_url": FRONTEND_URL
            }
        }
        
        with open("qa_test_report.json", "w") as f:
            json.dump(report, f, indent=2)
        
        print(f"\nDetailed report saved to: qa_test_report.json")
        
        # Return exit code based on results
        return 0 if self.results['failed'] == 0 else 1
    
    def run_all_tests(self):
        """Run complete test suite"""
        print(f"{BLUE}{'='*50}{RESET}")
        print(f"{BLUE}HomeVerse QA Test Suite{RESET}")
        print(f"{BLUE}{'='*50}{RESET}")
        
        # Core functionality tests
        self.test_health_check()
        self.test_authentication()
        self.test_applicant_management()
        self.test_project_management()
        self.test_application_workflow()
        self.test_investment_functionality()
        
        # Feature tests
        self.test_analytics_endpoints()
        self.test_contact_form()
        self.test_user_settings()
        self.test_map_functionality()
        self.test_export_functionality()
        
        # Generate report
        return self.generate_report()

if __name__ == "__main__":
    tester = QATester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)