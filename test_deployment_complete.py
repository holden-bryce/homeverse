#!/usr/bin/env python3
"""
Comprehensive deployment test - wait for completion then test functionality
"""

import requests
import time
import json
from datetime import datetime

def wait_for_deployment():
    """Wait until deployment is fully complete"""
    
    print("⏳ WAITING FOR DEPLOYMENT TO COMPLETE")
    print("=" * 50)
    
    # Check for our specific commit markers
    expected_markers = [
        "Emergency Login",
        "Emergency Dashboard", 
        "07cbe18"  # Our commit hash
    ]
    
    max_wait = 10  # 10 minutes max
    start_time = datetime.now()
    
    while True:
        elapsed = (datetime.now() - start_time).total_seconds() / 60
        
        if elapsed > max_wait:
            print(f"\n⏰ Timeout after {max_wait} minutes")
            return False
            
        try:
            # Check login page
            response = requests.get('https://homeverse-frontend.onrender.com/auth/login', timeout=10)
            
            if response.status_code == 200:
                content = response.text
                found_markers = [m for m in expected_markers if m in content]
                
                print(f"\rChecking deployment... Found {len(found_markers)}/{len(expected_markers)} markers", end='')
                
                if len(found_markers) >= 2:  # At least 2 markers found
                    print(f"\n✅ Deployment complete! (took {elapsed:.1f} minutes)")
                    return True
                    
        except Exception as e:
            print(f"\rChecking deployment... Error: {str(e)[:50]}", end='')
            
        time.sleep(10)

def test_login_functionality():
    """Test the login page functionality"""
    
    print("\n🔐 TESTING LOGIN PAGE")
    print("=" * 30)
    
    try:
        response = requests.get('https://homeverse-frontend.onrender.com/auth/login', timeout=10)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            content = response.text
            
            # Check for expected elements
            checks = {
                "Emergency Login title": "Emergency Login" in content,
                "Test credentials section": "Test Credentials" in content,
                "Email input field": 'type="email"' in content,
                "Password input field": 'type="password"' in content,
                "Sign in button": "Sign in" in content or "Signing in" in content,
                "HomeVerse logo": "HomeVerse" in content or "Logo" in content
            }
            
            for check, result in checks.items():
                print(f"  {check}: {'✅' if result else '❌'}")
                
            return all(checks.values())
        else:
            print(f"❌ Unexpected status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_api_login():
    """Test actual login via API"""
    
    print("\n🔑 TESTING API LOGIN")
    print("=" * 30)
    
    # Test with admin credentials
    login_data = {
        "email": "admin@test.com",
        "password": "password123"
    }
    
    try:
        # First check if backend is up
        backend_response = requests.get('https://homeverse-api.onrender.com', timeout=10)
        print(f"Backend status: {backend_response.status_code}")
        
        if backend_response.status_code == 200:
            print("✅ Backend is running")
            
            # Try login endpoint
            login_response = requests.post(
                'https://homeverse-api.onrender.com/api/auth/login',
                json=login_data,
                timeout=10
            )
            
            print(f"Login endpoint status: {login_response.status_code}")
            
            if login_response.status_code == 200:
                data = login_response.json()
                print(f"✅ Login successful: {data.get('email', 'No email in response')}")
                return True
            else:
                print(f"❌ Login failed: {login_response.text[:200]}")
                
    except Exception as e:
        print(f"❌ API error: {e}")
        
    return False

def test_dashboard_access():
    """Test dashboard access patterns"""
    
    print("\n📊 TESTING DASHBOARD ACCESS")
    print("=" * 30)
    
    try:
        # Test unauthenticated access
        response = requests.get(
            'https://homeverse-frontend.onrender.com/dashboard',
            timeout=10,
            allow_redirects=False
        )
        
        print(f"Dashboard status (unauthenticated): {response.status_code}")
        
        if response.status_code == 200:
            content = response.text
            
            # Check for emergency dashboard
            if "Emergency Dashboard" in content:
                print("✅ Emergency Dashboard component found")
            elif "Loading" in content:
                print("✅ Loading state shown")
            else:
                print("⚠️ Unexpected dashboard content")
                
        elif response.status_code in [302, 307]:
            location = response.headers.get('Location', 'unknown')
            print(f"✅ Redirect to: {location}")
            
            if 'login' in location:
                print("✅ Correctly redirecting to login")
                return True
        
    except Exception as e:
        print(f"❌ Dashboard error: {e}")
        
    return False

def run_local_comparison():
    """Instructions for local testing"""
    
    print("\n🏠 LOCAL TESTING COMPARISON")
    print("=" * 50)
    print("To test locally and compare:")
    print("\n1. Backend:")
    print("   cd /mnt/c/Users/12486/homeverse")
    print("   python3 supabase_backend.py")
    print("   # Should start on http://localhost:8000")
    print("\n2. Frontend:")
    print("   cd /mnt/c/Users/12486/homeverse/frontend")
    print("   npm run dev")
    print("   # Should start on http://localhost:3000")
    print("\n3. Test locally:")
    print("   - Open http://localhost:3000/auth/login")
    print("   - Should see Emergency Login form")
    print("   - Login with admin@test.com / password123")
    print("   - Should reach dashboard without loops")
    print("\n4. Compare with production:")
    print("   - If works locally but not on Render: Build/deployment issue")
    print("   - If fails locally too: Code issue")

def main():
    """Run complete deployment test"""
    
    print("🚀 COMPREHENSIVE DEPLOYMENT TEST")
    print("Testing emergency routing fixes")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Step 1: Wait for deployment
    if not wait_for_deployment():
        print("\n❌ Deployment did not complete in time")
        print("Try accessing manually: https://homeverse-frontend.onrender.com/auth/login")
        return
    
    # Step 2: Test functionality
    print("\n🧪 RUNNING FUNCTIONALITY TESTS")
    
    results = {
        "Login Page": test_login_functionality(),
        "API Login": test_api_login(),
        "Dashboard Access": test_dashboard_access()
    }
    
    # Step 3: Summary
    print("\n📋 TEST SUMMARY")
    print("=" * 30)
    
    for test, passed in results.items():
        print(f"{test}: {'✅ PASSED' if passed else '❌ FAILED'}")
    
    if all(results.values()):
        print("\n🎉 ALL TESTS PASSED!")
        print("The emergency fixes are working correctly on Render.")
    else:
        print("\n⚠️ SOME TESTS FAILED")
        print("Consider testing locally to isolate the issue.")
        run_local_comparison()

if __name__ == "__main__":
    main()