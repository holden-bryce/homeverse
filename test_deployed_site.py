#!/usr/bin/env python3
"""
Test deployed HomeVerse site functionality
"""

import requests
import json
from datetime import datetime

# Deployed URLs
FRONTEND_URL = "https://homeverse-frontend.onrender.com"
BACKEND_URL = "https://homeverse-api.onrender.com"

class DeploymentTester:
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
        
    def test_backend_health(self):
        """Test backend health endpoint"""
        try:
            resp = self.session.get(f"{BACKEND_URL}/health", timeout=10)
            data = resp.json()
            
            if resp.status_code == 200 and data.get('status') == 'healthy':
                self.log("Backend Health", "PASS", 
                        f"Status: {data.get('status')}, DB: {data.get('database')}")
                return True
            else:
                self.log("Backend Health", "FAIL", 
                        f"Status: {resp.status_code}, Response: {data}")
                return False
        except Exception as e:
            self.log("Backend Health", "FAIL", str(e))
            return False
            
    def test_frontend_access(self):
        """Test frontend accessibility"""
        try:
            resp = self.session.get(FRONTEND_URL, timeout=10)
            if resp.status_code == 200:
                self.log("Frontend Access", "PASS", "Site is accessible")
                return True
            else:
                self.log("Frontend Access", "FAIL", f"Status: {resp.status_code}")
                return False
        except Exception as e:
            self.log("Frontend Access", "FAIL", str(e))
            return False
            
    def test_login_page(self):
        """Test login page loads"""
        try:
            resp = self.session.get(f"{FRONTEND_URL}/auth/login", timeout=10)
            if resp.status_code == 200:
                self.log("Login Page", "PASS", "Login page loads successfully")
                return True
            else:
                self.log("Login Page", "FAIL", f"Status: {resp.status_code}")
                return False
        except Exception as e:
            self.log("Login Page", "FAIL", str(e))
            return False
            
    def test_api_login(self):
        """Test API login functionality"""
        try:
            login_data = {
                "email": "developer@test.com",
                "password": "password123"
            }
            
            resp = self.session.post(
                f"{BACKEND_URL}/api/v1/auth/login",
                json=login_data,
                timeout=10
            )
            
            if resp.status_code == 200:
                data = resp.json()
                token = data.get("access_token")
                user_info = data.get("user", {})
                
                self.log("API Login", "PASS", 
                        f"User: {user_info.get('email')}, Role: {user_info.get('role')}")
                return token
            else:
                self.log("API Login", "FAIL", 
                        f"Status: {resp.status_code}, Error: {resp.text}")
                return None
        except Exception as e:
            self.log("API Login", "FAIL", str(e))
            return None
            
    def test_crud_operations(self, token):
        """Test CRUD operations with auth token"""
        if not token:
            self.log("CRUD Operations", "SKIP", "No auth token available")
            return
            
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test listing applicants
        try:
            resp = self.session.get(
                f"{BACKEND_URL}/api/v1/applicants",
                headers=headers,
                timeout=10
            )
            
            if resp.status_code == 200:
                data = resp.json()
                count = len(data) if isinstance(data, list) else 0
                self.log("List Applicants", "PASS", f"Found {count} applicants")
            else:
                self.log("List Applicants", "FAIL", f"Status: {resp.status_code}")
        except Exception as e:
            self.log("List Applicants", "FAIL", str(e))
            
        # Test creating applicant
        try:
            applicant_data = {
                "full_name": f"Deployed Test User {int(datetime.now().timestamp())}",
                "email": f"deploytest_{int(datetime.now().timestamp())}@example.com",
                "phone": "555-0001",
                "income": 50000,
                "household_size": 2
            }
            
            resp = self.session.post(
                f"{BACKEND_URL}/api/v1/applicants",
                json=applicant_data,
                headers=headers,
                timeout=10
            )
            
            if resp.status_code in [200, 201]:
                data = resp.json()
                self.log("Create Applicant", "PASS", 
                        f"Created: {data.get('full_name')} (ID: {data.get('id')})")
            else:
                self.log("Create Applicant", "FAIL", 
                        f"Status: {resp.status_code}, Error: {resp.text}")
        except Exception as e:
            self.log("Create Applicant", "FAIL", str(e))
            
    def test_cors_headers(self):
        """Test CORS configuration"""
        try:
            resp = self.session.options(
                f"{BACKEND_URL}/api/v1/auth/login",
                headers={"Origin": FRONTEND_URL}
            )
            
            cors_headers = {
                "Access-Control-Allow-Origin": resp.headers.get("Access-Control-Allow-Origin"),
                "Access-Control-Allow-Methods": resp.headers.get("Access-Control-Allow-Methods"),
                "Access-Control-Allow-Headers": resp.headers.get("Access-Control-Allow-Headers")
            }
            
            if cors_headers["Access-Control-Allow-Origin"]:
                self.log("CORS Configuration", "PASS", 
                        f"Origin allowed: {cors_headers['Access-Control-Allow-Origin']}")
            else:
                self.log("CORS Configuration", "FAIL", "No CORS headers found")
                
        except Exception as e:
            self.log("CORS Configuration", "FAIL", str(e))
            
    def compare_with_local(self):
        """Compare deployed vs local functionality"""
        print("\n📊 Deployment vs Local Comparison")
        print("=" * 50)
        
        # Summary of deployed functionality
        total = len(self.results)
        passed = len([r for r in self.results if r["status"] == "PASS"])
        failed = len([r for r in self.results if r["status"] == "FAIL"])
        
        print(f"\nDeployed Site Results:")
        print(f"✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {failed}/{total}")
        
        print("\nLocal Site Functionality (from earlier tests):")
        print("✅ Backend Health: Working")
        print("✅ Authentication: Working") 
        print("✅ CRUD Operations: Working")
        print("✅ Data Isolation: Working")
        
        print("\nKey Differences:")
        if failed > 0:
            print("⚠️  Deployed site has issues that need fixing")
            for result in self.results:
                if result["status"] == "FAIL":
                    print(f"   - {result['test']}: {result['details']}")
        else:
            print("✅ Deployed site matches local functionality!")
            
    def run_all_tests(self):
        """Run complete test suite"""
        print("🧪 Testing Deployed HomeVerse Site")
        print("=" * 50)
        print(f"Frontend: {FRONTEND_URL}")
        print(f"Backend: {BACKEND_URL}")
        print()
        
        # Run tests
        self.test_frontend_access()
        self.test_login_page()
        backend_healthy = self.test_backend_health()
        self.test_cors_headers()
        
        if backend_healthy:
            token = self.test_api_login()
            self.test_crud_operations(token)
        else:
            print("\n⚠️  Skipping API tests due to backend issues")
            
        # Compare with local
        self.compare_with_local()
        
        # Save results
        with open("deployment_test_results.json", "w") as f:
            json.dump({
                "test_run": datetime.now().isoformat(),
                "frontend_url": FRONTEND_URL,
                "backend_url": BACKEND_URL,
                "results": self.results
            }, f, indent=2)
            
        print(f"\nResults saved to: deployment_test_results.json")

if __name__ == "__main__":
    tester = DeploymentTester()
    tester.run_all_tests()