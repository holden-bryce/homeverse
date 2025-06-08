#!/usr/bin/env python3
"""Production Readiness Checklist and Verification Script"""
import os
import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Tuple

class ProductionReadinessChecker:
    def __init__(self):
        self.api_url = "https://homeverse-api.onrender.com"
        self.frontend_url = "https://homeverse-frontend.onrender.com"
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "passed": 0,
            "failed": 0,
            "warnings": 0,
            "details": []
        }
        
    def add_result(self, category: str, test: str, status: str, details: str = ""):
        """Add test result"""
        emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        result = {
            "category": category,
            "test": test,
            "status": f"{emoji} {status}",
            "details": details
        }
        self.results["details"].append(result)
        
        if status == "PASS":
            self.results["passed"] += 1
        elif status == "FAIL":
            self.results["failed"] += 1
        else:
            self.results["warnings"] += 1
            
    def test_infrastructure(self):
        """Test basic infrastructure"""
        print("\n🏗️  Testing Infrastructure...")
        
        # Backend health
        try:
            resp = requests.get(f"{self.api_url}/health", timeout=5)
            if resp.status_code == 200:
                self.add_result("Infrastructure", "Backend API Health", "PASS", "Service is healthy")
            else:
                self.add_result("Infrastructure", "Backend API Health", "FAIL", f"Status: {resp.status_code}")
        except Exception as e:
            self.add_result("Infrastructure", "Backend API Health", "FAIL", str(e))
            
        # Frontend availability
        try:
            resp = requests.get(self.frontend_url, timeout=5)
            if resp.status_code == 200:
                self.add_result("Infrastructure", "Frontend Availability", "PASS", "Frontend is accessible")
            else:
                self.add_result("Infrastructure", "Frontend Availability", "FAIL", f"Status: {resp.status_code}")
        except Exception as e:
            self.add_result("Infrastructure", "Frontend Availability", "FAIL", str(e))
            
        # API Documentation
        try:
            resp = requests.get(f"{self.api_url}/docs", timeout=5)
            if resp.status_code == 200:
                self.add_result("Infrastructure", "API Documentation", "PASS", "Swagger docs available")
            else:
                self.add_result("Infrastructure", "API Documentation", "FAIL", f"Status: {resp.status_code}")
        except Exception as e:
            self.add_result("Infrastructure", "API Documentation", "FAIL", str(e))
            
    def test_authentication(self):
        """Test authentication system"""
        print("\n🔐 Testing Authentication...")
        
        test_users = [
            ("developer@test.com", "password123", "developer"),
            ("lender@test.com", "password123", "lender"),
            ("admin@test.com", "password123", "admin")
        ]
        
        for email, password, role in test_users:
            try:
                resp = requests.post(
                    f"{self.api_url}/api/v1/auth/login",
                    json={"email": email, "password": password},
                    timeout=5
                )
                
                if resp.status_code == 200:
                    data = resp.json()
                    if "access_token" in data:
                        self.add_result("Authentication", f"Login - {role}", "PASS", "Token received")
                    else:
                        self.add_result("Authentication", f"Login - {role}", "FAIL", "No token in response")
                elif resp.status_code == 500:
                    self.add_result("Authentication", f"Login - {role}", "FAIL", "Server error - DB not initialized")
                else:
                    self.add_result("Authentication", f"Login - {role}", "FAIL", f"Status: {resp.status_code}")
            except Exception as e:
                self.add_result("Authentication", f"Login - {role}", "FAIL", str(e))
                
    def test_api_endpoints(self):
        """Test core API endpoints"""
        print("\n🔌 Testing API Endpoints...")
        
        endpoints = [
            ("GET", "/api/v1/applicants", "List Applicants"),
            ("GET", "/api/v1/projects", "List Projects"),
            ("POST", "/api/v1/contact", "Contact Form")
        ]
        
        # Try to get auth token first
        token = None
        try:
            resp = requests.post(
                f"{self.api_url}/api/v1/auth/login",
                json={"email": "developer@test.com", "password": "password123"}
            )
            if resp.status_code == 200:
                token = resp.json().get("access_token")
        except:
            pass
            
        for method, endpoint, name in endpoints:
            try:
                headers = {"Authorization": f"Bearer {token}"} if token else {}
                
                if method == "GET":
                    resp = requests.get(f"{self.api_url}{endpoint}", headers=headers, timeout=5)
                else:
                    # Test contact form
                    data = {
                        "name": "Test User",
                        "email": "test@example.com",
                        "subject": "Test",
                        "message": "Production test"
                    }
                    resp = requests.post(f"{self.api_url}{endpoint}", json=data, timeout=5)
                    
                if resp.status_code in [200, 201]:
                    self.add_result("API Endpoints", name, "PASS", f"Status: {resp.status_code}")
                elif resp.status_code == 401:
                    self.add_result("API Endpoints", name, "WARN", "Requires authentication")
                else:
                    self.add_result("API Endpoints", name, "FAIL", f"Status: {resp.status_code}")
            except Exception as e:
                self.add_result("API Endpoints", name, "FAIL", str(e))
                
    def test_security(self):
        """Test security configurations"""
        print("\n🔒 Testing Security...")
        
        # HTTPS enforcement
        if self.api_url.startswith("https://"):
            self.add_result("Security", "HTTPS - Backend", "PASS", "Using HTTPS")
        else:
            self.add_result("Security", "HTTPS - Backend", "FAIL", "Not using HTTPS")
            
        if self.frontend_url.startswith("https://"):
            self.add_result("Security", "HTTPS - Frontend", "PASS", "Using HTTPS")
        else:
            self.add_result("Security", "HTTPS - Frontend", "FAIL", "Not using HTTPS")
            
        # CORS configuration
        try:
            resp = requests.options(
                f"{self.api_url}/api/v1/auth/login",
                headers={"Origin": self.frontend_url}
            )
            cors_header = resp.headers.get("Access-Control-Allow-Origin")
            if cors_header:
                self.add_result("Security", "CORS Configuration", "PASS", f"Allow-Origin: {cors_header}")
            else:
                self.add_result("Security", "CORS Configuration", "FAIL", "No CORS headers")
        except:
            self.add_result("Security", "CORS Configuration", "WARN", "Could not test CORS")
            
    def test_performance(self):
        """Test performance metrics"""
        print("\n⚡ Testing Performance...")
        
        # Backend response time
        try:
            start = time.time()
            resp = requests.get(f"{self.api_url}/health", timeout=5)
            duration = (time.time() - start) * 1000
            
            if duration < 500:
                self.add_result("Performance", "Backend Response Time", "PASS", f"{duration:.0f}ms")
            elif duration < 1000:
                self.add_result("Performance", "Backend Response Time", "WARN", f"{duration:.0f}ms")
            else:
                self.add_result("Performance", "Backend Response Time", "FAIL", f"{duration:.0f}ms")
        except:
            self.add_result("Performance", "Backend Response Time", "FAIL", "Timeout")
            
        # Frontend load time
        try:
            start = time.time()
            resp = requests.get(self.frontend_url, timeout=10)
            duration = (time.time() - start) * 1000
            
            if duration < 1000:
                self.add_result("Performance", "Frontend Load Time", "PASS", f"{duration:.0f}ms")
            elif duration < 2000:
                self.add_result("Performance", "Frontend Load Time", "WARN", f"{duration:.0f}ms")
            else:
                self.add_result("Performance", "Frontend Load Time", "FAIL", f"{duration:.0f}ms")
        except:
            self.add_result("Performance", "Frontend Load Time", "FAIL", "Timeout")
            
    def generate_report(self):
        """Generate final report"""
        print("\n" + "=" * 60)
        print("📊 PRODUCTION READINESS REPORT")
        print("=" * 60)
        print(f"Timestamp: {self.results['timestamp']}")
        print(f"Tests Passed: {self.results['passed']}")
        print(f"Tests Failed: {self.results['failed']}")
        print(f"Warnings: {self.results['warnings']}")
        print("\nDetailed Results:")
        print("-" * 60)
        
        current_category = None
        for result in self.results["details"]:
            if result["category"] != current_category:
                current_category = result["category"]
                print(f"\n{current_category}:")
            print(f"  {result['status']} {result['test']}: {result['details']}")
            
        # Overall assessment
        print("\n" + "=" * 60)
        total_tests = self.results['passed'] + self.results['failed'] + self.results['warnings']
        success_rate = (self.results['passed'] / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.results['failed'] == 0:
            print("\n🎉 PRODUCTION READY: All critical tests passed!")
        elif self.results['failed'] <= 2:
            print("\n⚠️  NEARLY READY: Fix remaining issues before launch")
        else:
            print("\n❌ NOT READY: Critical issues need to be resolved")
            
        # Save report
        with open("production_readiness_report.json", "w") as f:
            json.dump(self.results, f, indent=2)
        print("\n📄 Report saved to: production_readiness_report.json")
        
        # Recommendations
        print("\n📌 Recommendations:")
        if any("DB not initialized" in r["details"] for r in self.results["details"]):
            print("1. Initialize PostgreSQL database with test users")
            print("   - Set DATABASE_URL environment variable on Render")
            print("   - Run database initialization script")
            
        if any("authentication" in r["test"].lower() and r["status"].endswith("FAIL") 
               for r in self.results["details"]):
            print("2. Fix authentication system")
            print("   - Ensure JWT_SECRET_KEY is set")
            print("   - Verify database connection")
            
        if self.results['warnings'] > 0:
            print("3. Address warning items for optimal performance")
            
        print("\n🚀 Next Steps:")
        print("1. Fix any failed tests")
        print("2. Run this script again to verify fixes")
        print("3. Monitor production metrics for 24 hours")
        print("4. Enable automated monitoring")

def main():
    """Run production readiness checks"""
    print("🚀 HomeVerse Production Readiness Checker")
    print("=" * 60)
    
    checker = ProductionReadinessChecker()
    
    # Run all tests
    checker.test_infrastructure()
    checker.test_authentication()
    checker.test_api_endpoints()
    checker.test_security()
    checker.test_performance()
    
    # Generate report
    checker.generate_report()

if __name__ == "__main__":
    main()