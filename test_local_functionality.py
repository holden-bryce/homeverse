#!/usr/bin/env python3
"""
Test local functionality comprehensively
"""

import requests
import time
import json
from datetime import datetime

BASE_URL = "http://localhost:3000"
API_URL = "http://localhost:8000"

def wait_for_frontend():
    """Wait for frontend to be ready"""
    print("⏳ Waiting for frontend to start...")
    max_attempts = 30
    
    for i in range(max_attempts):
        try:
            response = requests.get(BASE_URL, timeout=2)
            if response.status_code == 200:
                print("✅ Frontend is ready!")
                return True
        except:
            pass
        
        if i < max_attempts - 1:
            print(f"\r   Attempt {i+1}/{max_attempts}...", end='')
            time.sleep(2)
    
    print("\n❌ Frontend did not start in time")
    return False

def test_backend_api():
    """Test backend API endpoints"""
    print("\n🔌 TESTING BACKEND API")
    print("=" * 30)
    
    tests = {
        "Root endpoint": f"{API_URL}/",
        "API docs": f"{API_URL}/docs",
        "Health check": f"{API_URL}/api/health",
    }
    
    for name, url in tests.items():
        try:
            response = requests.get(url, timeout=5)
            print(f"{name}: {response.status_code} ✅" if response.status_code in [200, 404] else f"{name}: {response.status_code} ❌")
        except Exception as e:
            print(f"{name}: ❌ Error - {str(e)[:50]}")

def test_frontend_pages():
    """Test frontend pages accessibility"""
    print("\n📄 TESTING FRONTEND PAGES")
    print("=" * 30)
    
    pages = {
        "Homepage": "/",
        "Login page": "/auth/login",
        "Register page": "/auth/register",
        "Dashboard": "/dashboard",
        "About": "/about",
        "Contact": "/contact"
    }
    
    for name, path in pages.items():
        try:
            response = requests.get(f"{BASE_URL}{path}", timeout=5, allow_redirects=False)
            status = response.status_code
            
            if status == 200:
                # Check for emergency components
                content = response.text
                emergency_login = "Emergency Login" in content
                emergency_dashboard = "Emergency Dashboard" in content
                
                if path == "/auth/login" and emergency_login:
                    print(f"{name}: {status} ✅ (Emergency Login found)")
                elif path == "/dashboard" and emergency_dashboard:
                    print(f"{name}: {status} ✅ (Emergency Dashboard found)")
                else:
                    print(f"{name}: {status} ✅")
            elif status in [301, 302, 307]:
                location = response.headers.get('Location', 'unknown')
                print(f"{name}: {status} → {location}")
            else:
                print(f"{name}: {status} ⚠️")
                
        except Exception as e:
            print(f"{name}: ❌ Error - {str(e)[:50]}")

def test_console_logs():
    """Check for expected console log patterns"""
    print("\n🔍 CHECKING FOR EMERGENCY COMPONENTS")
    print("=" * 40)
    
    # Test login page content
    try:
        response = requests.get(f"{BASE_URL}/auth/login", timeout=5)
        if response.status_code == 200:
            content = response.text
            
            checks = {
                "Emergency Login title": "Emergency Login" in content,
                "Test credentials section": "Test Credentials" in content,
                "Admin test account": "admin@test.com" in content,
                "Emergency client import": "supabase-emergency" in content,
                "Console log statements": "console.log" in content
            }
            
            for check, found in checks.items():
                print(f"{check}: {'✅' if found else '❌'}")
                
    except Exception as e:
        print(f"❌ Error checking login page: {e}")

def test_api_auth():
    """Test authentication via API"""
    print("\n🔐 TESTING LOCAL AUTHENTICATION")
    print("=" * 35)
    
    # Test login endpoint
    login_data = {
        "email": "admin@test.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(
            f"{API_URL}/api/auth/login",
            json=login_data,
            timeout=5
        )
        
        print(f"Login endpoint status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login successful: {data.get('email', 'No email')}")
            if 'access_token' in data:
                print("✅ Access token received")
        else:
            print(f"❌ Login failed: {response.text[:100]}")
            
    except Exception as e:
        print(f"❌ API auth error: {e}")

def provide_testing_instructions():
    """Provide manual testing instructions"""
    print("\n📋 MANUAL TESTING INSTRUCTIONS")
    print("=" * 40)
    print("\n1. Open your browser to: http://localhost:3001/auth/login")
    print("\n2. Open Browser DevTools Console (F12)")
    print("\n3. Look for these console logs:")
    print("   - 'Emergency Login: Page component loaded'")
    print("   - 'Emergency Login: Form loaded'")
    print("   - 'Emergency Supabase Client: Initializing'")
    print("\n4. Try logging in with:")
    print("   Email: admin@test.com")
    print("   Password: password123")
    print("\n5. After clicking Sign In, watch for:")
    print("   - 'Emergency Login: Form submitted'")
    print("   - 'Emergency Sign In: Starting...'")
    print("   - 'Emergency Sign In: Success!'")
    print("\n6. Check if you reach dashboard without:")
    print("   - Profile query timeout errors")
    print("   - Infinite loading loops")
    print("\n7. On dashboard, look for:")
    print("   - 'Emergency Dashboard: Starting auth check...'")
    print("   - Navigation sidebar with correct role items")

def main():
    """Run all local tests"""
    print("🏠 LOCAL FUNCTIONALITY TEST")
    print("Testing emergency fixes locally")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # Wait for frontend
    if not wait_for_frontend():
        print("\n❌ Cannot proceed without frontend")
        print("Make sure to run: cd frontend && npm run dev")
        return
    
    # Run tests
    test_backend_api()
    test_frontend_pages()
    test_console_logs()
    test_api_auth()
    provide_testing_instructions()
    
    print("\n" + "=" * 50)
    print("🎯 LOCAL TEST COMPLETE")
    print("\nCompare these results with production:")
    print("- Production: https://homeverse-frontend.onrender.com")
    print("- Local: http://localhost:3001")
    print("\nIf local works but production doesn't:")
    print("→ Issue is with Render deployment/build")
    print("\nIf both have same issue:")
    print("→ Issue is in the code itself")

if __name__ == "__main__":
    main()