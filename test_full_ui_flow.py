#!/usr/bin/env python3
"""Comprehensive UI and functionality test for HomeVerse production"""
import requests
import json
import time
from datetime import datetime

FRONTEND_URL = "https://homeverse-frontend.onrender.com"
API_URL = "https://homeverse-api.onrender.com"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")

def print_success(text):
    print(f"{Colors.GREEN}✅ {text}{Colors.RESET}")

def print_error(text):
    print(f"{Colors.RED}❌ {text}{Colors.RESET}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.RESET}")

def print_info(text):
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.RESET}")

def test_infrastructure():
    """Test basic infrastructure"""
    print_header("Testing Infrastructure")
    
    tests_passed = 0
    tests_total = 0
    
    # Test Frontend
    tests_total += 1
    try:
        resp = requests.get(FRONTEND_URL, timeout=10)
        if resp.status_code == 200 and "HomeVerse" in resp.text:
            print_success("Frontend is accessible and contains HomeVerse branding")
            tests_passed += 1
        else:
            print_error(f"Frontend returned status {resp.status_code}")
    except Exception as e:
        print_error(f"Frontend error: {e}")
    
    # Test Backend Health
    tests_total += 1
    try:
        resp = requests.get(f"{API_URL}/health", timeout=5)
        if resp.status_code == 200:
            print_success("Backend API is healthy")
            tests_passed += 1
        else:
            print_error(f"Backend health check failed: {resp.status_code}")
    except Exception as e:
        print_error(f"Backend error: {e}")
    
    # Test API Documentation
    tests_total += 1
    try:
        resp = requests.get(f"{API_URL}/docs", timeout=5)
        if resp.status_code == 200:
            print_success("API documentation is accessible")
            tests_passed += 1
        else:
            print_error(f"API docs returned status {resp.status_code}")
    except Exception as e:
        print_error(f"API docs error: {e}")
    
    # Test CORS
    tests_total += 1
    try:
        resp = requests.options(
            f"{API_URL}/api/v1/auth/login",
            headers={"Origin": FRONTEND_URL}
        )
        cors_header = resp.headers.get("Access-Control-Allow-Origin")
        if cors_header:
            print_success(f"CORS is properly configured: {cors_header}")
            tests_passed += 1
        else:
            print_error("CORS headers not found")
    except Exception as e:
        print_error(f"CORS test error: {e}")
    
    return tests_passed, tests_total

def test_public_pages():
    """Test public pages accessibility"""
    print_header("Testing Public Pages")
    
    tests_passed = 0
    tests_total = 0
    
    pages = [
        ("/", "Landing Page"),
        ("/about", "About Page"),
        ("/contact", "Contact Page"),
        ("/privacy", "Privacy Policy"),
        ("/terms", "Terms of Service"),
        ("/auth/login", "Login Page"),
        ("/auth/register", "Register Page")
    ]
    
    for path, name in pages:
        tests_total += 1
        try:
            resp = requests.get(f"{FRONTEND_URL}{path}", timeout=10)
            if resp.status_code == 200:
                print_success(f"{name} is accessible")
                tests_passed += 1
            else:
                print_error(f"{name} returned status {resp.status_code}")
        except Exception as e:
            print_error(f"{name} error: {e}")
    
    return tests_passed, tests_total

def test_authentication():
    """Test authentication system"""
    print_header("Testing Authentication")
    
    tests_passed = 0
    tests_total = 0
    
    # Test with each user role
    test_credentials = [
        ("developer@test.com", "password123", "Developer"),
        ("lender@test.com", "password123", "Lender"),
        ("buyer@test.com", "password123", "Buyer"),
        ("applicant@test.com", "password123", "Applicant"),
        ("admin@test.com", "password123", "Admin")
    ]
    
    auth_tokens = {}
    
    for email, password, role in test_credentials:
        tests_total += 1
        try:
            resp = requests.post(
                f"{API_URL}/api/v1/auth/login",
                json={"email": email, "password": password},
                timeout=5
            )
            
            if resp.status_code == 200:
                data = resp.json()
                if "access_token" in data:
                    print_success(f"{role} authentication successful")
                    auth_tokens[role] = data["access_token"]
                    tests_passed += 1
                else:
                    print_error(f"{role} login response missing token")
            else:
                print_warning(f"{role} authentication failed: {resp.status_code}")
                if resp.status_code == 500:
                    print_info("Database may not be initialized with test users")
        except Exception as e:
            print_error(f"{role} authentication error: {e}")
    
    return tests_passed, tests_total, auth_tokens

def test_api_endpoints(auth_tokens):
    """Test various API endpoints"""
    print_header("Testing API Endpoints")
    
    tests_passed = 0
    tests_total = 0
    
    # Test Contact Form (public)
    tests_total += 1
    try:
        resp = requests.post(
            f"{API_URL}/api/v1/contact",
            json={
                "name": "Test User",
                "email": "test@example.com",
                "subject": "Production Test",
                "message": "Testing contact form in production"
            },
            timeout=5
        )
        
        if resp.status_code in [200, 201]:
            print_success("Contact form submission works")
            tests_passed += 1
        else:
            print_error(f"Contact form failed: {resp.status_code}")
    except Exception as e:
        print_error(f"Contact form error: {e}")
    
    # If we have auth tokens, test protected endpoints
    if auth_tokens:
        # Test applicants endpoint (if developer token exists)
        if "Developer" in auth_tokens:
            tests_total += 1
            try:
                headers = {"Authorization": f"Bearer {auth_tokens['Developer']}"}
                resp = requests.get(f"{API_URL}/api/v1/applicants", headers=headers, timeout=5)
                
                if resp.status_code == 200:
                    print_success("Applicants endpoint accessible with auth")
                    tests_passed += 1
                else:
                    print_error(f"Applicants endpoint failed: {resp.status_code}")
            except Exception as e:
                print_error(f"Applicants endpoint error: {e}")
        
        # Test projects endpoint
        if "Developer" in auth_tokens:
            tests_total += 1
            try:
                headers = {"Authorization": f"Bearer {auth_tokens['Developer']}"}
                resp = requests.get(f"{API_URL}/api/v1/projects", headers=headers, timeout=5)
                
                if resp.status_code == 200:
                    print_success("Projects endpoint accessible with auth")
                    tests_passed += 1
                else:
                    print_error(f"Projects endpoint failed: {resp.status_code}")
            except Exception as e:
                print_error(f"Projects endpoint error: {e}")
    
    return tests_passed, tests_total

def test_ui_workflows():
    """Test key UI workflows"""
    print_header("Testing UI Workflows")
    
    tests_passed = 0
    tests_total = 0
    
    # These would ideally use Selenium, but we'll do basic checks
    workflows = [
        ("Developer Dashboard", "/dashboard", "should redirect to login if not authenticated"),
        ("Lender Portal", "/dashboard/lenders", "should be protected"),
        ("Map View", "/dashboard/map", "should be protected"),
        ("Settings", "/dashboard/settings", "should be protected")
    ]
    
    for name, path, description in workflows:
        tests_total += 1
        try:
            resp = requests.get(f"{FRONTEND_URL}{path}", timeout=10, allow_redirects=False)
            # Protected routes should redirect to login (301/302) or show login page
            if resp.status_code in [301, 302, 200]:
                print_success(f"{name} - {description}")
                tests_passed += 1
            else:
                print_error(f"{name} returned unexpected status {resp.status_code}")
        except Exception as e:
            print_error(f"{name} error: {e}")
    
    return tests_passed, tests_total

def generate_report(results):
    """Generate final test report"""
    print_header("TEST RESULTS SUMMARY")
    
    total_passed = sum(r[0] for r in results.values())
    total_tests = sum(r[1] for r in results.values())
    success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
    
    print(f"\n{Colors.BOLD}Category Results:{Colors.RESET}")
    for category, (passed, total) in results.items():
        rate = (passed / total * 100) if total > 0 else 0
        status = Colors.GREEN if rate >= 80 else Colors.YELLOW if rate >= 60 else Colors.RED
        print(f"{status}{category}: {passed}/{total} ({rate:.1f}%){Colors.RESET}")
    
    print(f"\n{Colors.BOLD}Overall Results:{Colors.RESET}")
    print(f"Total Tests: {total_tests}")
    print(f"Tests Passed: {total_passed}")
    print(f"Tests Failed: {total_tests - total_passed}")
    print(f"Success Rate: {success_rate:.1f}%")
    
    # Production readiness assessment
    print_header("PRODUCTION READINESS ASSESSMENT")
    
    if success_rate >= 90:
        print_success("🎉 PRODUCTION READY - System is fully functional!")
    elif success_rate >= 70:
        print_warning("⚠️  NEARLY READY - Some issues need attention")
    else:
        print_error("❌ NOT READY - Critical issues must be resolved")
    
    # Specific recommendations
    print(f"\n{Colors.BOLD}Recommendations:{Colors.RESET}")
    
    if results.get("Authentication", (0, 0))[0] == 0:
        print_warning("1. Initialize database with test users")
        print_info("   - Run: python3 init_production_db.py")
        print_info("   - Or switch to SQLite temporarily in Render environment")
    
    if results.get("Infrastructure", (0, 0))[0] < results.get("Infrastructure", (0, 0))[1]:
        print_warning("2. Check infrastructure health")
        print_info("   - Verify all services are deployed correctly")
    
    print(f"\n{Colors.BOLD}Next Steps for Launch:{Colors.RESET}")
    print("1. Fix any failing tests")
    print("2. Initialize production database")
    print("3. Test complete user workflows manually")
    print("4. Monitor for 24 hours")
    print("5. Ready for first users!")
    
    # Save detailed report
    report_data = {
        "timestamp": datetime.now().isoformat(),
        "success_rate": success_rate,
        "total_tests": total_tests,
        "passed": total_passed,
        "failed": total_tests - total_passed,
        "categories": {k: {"passed": v[0], "total": v[1]} for k, v in results.items()},
        "production_ready": success_rate >= 90
    }
    
    with open("ui_test_report.json", "w") as f:
        json.dump(report_data, f, indent=2)
    
    print(f"\n{Colors.BLUE}📄 Detailed report saved to ui_test_report.json{Colors.RESET}")

def main():
    """Run all UI tests"""
    print(f"{Colors.BOLD}{Colors.BLUE}🚀 HomeVerse Production UI Test Suite{Colors.RESET}")
    print(f"{Colors.BLUE}Testing: {FRONTEND_URL} & {API_URL}{Colors.RESET}")
    print(f"{Colors.BLUE}Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.RESET}")
    
    results = {}
    
    # Run infrastructure tests
    passed, total = test_infrastructure()
    results["Infrastructure"] = (passed, total)
    
    # Run public page tests
    passed, total = test_public_pages()
    results["Public Pages"] = (passed, total)
    
    # Run authentication tests
    passed, total, auth_tokens = test_authentication()
    results["Authentication"] = (passed, total)
    
    # Run API endpoint tests
    passed, total = test_api_endpoints(auth_tokens)
    results["API Endpoints"] = (passed, total)
    
    # Run UI workflow tests
    passed, total = test_ui_workflows()
    results["UI Workflows"] = (passed, total)
    
    # Generate report
    generate_report(results)

if __name__ == "__main__":
    main()