#!/usr/bin/env python3
"""Production Validation Suite - Comprehensive testing of all systems"""
import requests
import json
import time
from datetime import datetime

class ProductionValidator:
    def __init__(self):
        self.backend_url = "https://homeverse-api.onrender.com"
        self.frontend_url = "https://homeverse-frontend.onrender.com"
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "tests_passed": 0,
            "tests_failed": 0,
            "details": []
        }
    
    def test_backend_health(self):
        """Test backend health endpoint"""
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=5)
            if response.status_code == 200 and response.json().get("status") == "healthy":
                self.log_result("Backend Health", True, "Service is healthy")
            else:
                self.log_result("Backend Health", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Backend Health", False, str(e))
    
    def test_api_endpoints(self):
        """Test various API endpoints"""
        endpoints = [
            ("/", "Root endpoint"),
            ("/docs", "API documentation"),
            ("/api/v1/auth/login", "Auth endpoint"),
        ]
        
        for endpoint, description in endpoints:
            try:
                response = requests.get(f"{self.backend_url}{endpoint}", 
                                      headers={"x-company-key": "test-company"},
                                      timeout=5)
                success = response.status_code in [200, 422, 405]  # 422/405 expected for some endpoints
                self.log_result(f"API: {description}", success, f"Status: {response.status_code}")
            except Exception as e:
                self.log_result(f"API: {description}", False, str(e))
    
    def test_authentication(self):
        """Test authentication flow"""
        try:
            response = requests.post(
                f"{self.backend_url}/api/v1/auth/login",
                json={"email": "developer@test.com", "password": "password123"},
                headers={"x-company-key": "test-company"},
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.log_result("Authentication", True, "Login successful, token received")
                    return data["access_token"]
                else:
                    self.log_result("Authentication", False, "No token in response")
            else:
                self.log_result("Authentication", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Authentication", False, str(e))
        return None
    
    def test_protected_endpoints(self, token):
        """Test endpoints that require authentication"""
        if not token:
            self.log_result("Protected Endpoints", False, "No auth token available")
            return
        
        headers = {
            "Authorization": f"Bearer {token}",
            "x-company-key": "test-company"
        }
        
        try:
            response = requests.get(f"{self.backend_url}/api/v1/applicants", headers=headers, timeout=5)
            success = response.status_code == 200
            self.log_result("Protected: Applicants", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Protected: Applicants", False, str(e))
    
    def test_frontend(self):
        """Test frontend availability"""
        try:
            response = requests.get(self.frontend_url, timeout=10)
            if response.status_code == 200 and len(response.content) > 1000:
                self.log_result("Frontend", True, "Page loaded successfully")
            else:
                self.log_result("Frontend", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Frontend", False, str(e))
    
    def test_cors(self):
        """Test CORS configuration"""
        try:
            response = requests.options(
                f"{self.backend_url}/api/v1/auth/login",
                headers={
                    "Origin": self.frontend_url,
                    "Access-Control-Request-Method": "POST",
                    "Access-Control-Request-Headers": "Content-Type"
                },
                timeout=5
            )
            
            cors_headers = response.headers.get("Access-Control-Allow-Origin")
            success = cors_headers is not None
            self.log_result("CORS Configuration", success, f"Allow-Origin: {cors_headers}")
        except Exception as e:
            self.log_result("CORS Configuration", False, str(e))
    
    def test_email_endpoint(self):
        """Test email functionality endpoint"""
        try:
            response = requests.post(
                f"{self.backend_url}/api/v1/contact",
                json={
                    "name": "Production Test",
                    "email": "test@example.com",
                    "subject": "Automated Test",
                    "message": "This is an automated production validation test",
                    "department": "support"
                },
                headers={"x-company-key": "test-company"},
                timeout=10
            )
            
            success = response.status_code == 200
            self.log_result("Email Endpoint", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Email Endpoint", False, str(e))
    
    def test_response_times(self):
        """Test response times for performance"""
        endpoints = [
            (f"{self.backend_url}/health", "Backend Health"),
            (f"{self.frontend_url}/", "Frontend Load")
        ]
        
        for url, name in endpoints:
            try:
                start = time.time()
                response = requests.get(url, timeout=5)
                elapsed = (time.time() - start) * 1000  # Convert to ms
                
                success = elapsed < 1000  # Should respond within 1 second
                self.log_result(f"Performance: {name}", success, f"{elapsed:.0f}ms")
            except Exception as e:
                self.log_result(f"Performance: {name}", False, str(e))
    
    def log_result(self, test_name, success, details):
        """Log test result"""
        if success:
            self.results["tests_passed"] += 1
            status = "✅ PASS"
        else:
            self.results["tests_failed"] += 1
            status = "❌ FAIL"
        
        result = {
            "test": test_name,
            "status": status,
            "details": details
        }
        self.results["details"].append(result)
        print(f"{status} {test_name}: {details}")
    
    def run_all_tests(self):
        """Run complete validation suite"""
        print("🚀 Starting Production Validation Suite")
        print("=" * 50)
        
        # Run all tests
        self.test_backend_health()
        self.test_api_endpoints()
        token = self.test_authentication()
        self.test_protected_endpoints(token)
        self.test_frontend()
        self.test_cors()
        self.test_email_endpoint()
        self.test_response_times()
        
        # Generate report
        print("\n" + "=" * 50)
        print("📊 VALIDATION SUMMARY")
        print(f"Tests Passed: {self.results['tests_passed']}")
        print(f"Tests Failed: {self.results['tests_failed']}")
        print(f"Success Rate: {(self.results['tests_passed'] / (self.results['tests_passed'] + self.results['tests_failed']) * 100):.1f}%")
        
        # Save detailed report
        with open("production_validation_report.json", "w") as f:
            json.dump(self.results, f, indent=2)
        
        return self.results["tests_failed"] == 0

if __name__ == "__main__":
    validator = ProductionValidator()
    success = validator.run_all_tests()
    
    if success:
        print("\n✅ ALL PRODUCTION TESTS PASSED!")
    else:
        print("\n⚠️  Some tests failed - review details above")