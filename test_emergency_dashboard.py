#!/usr/bin/env python3
"""
Test the emergency dashboard functionality
"""

import requests
import time

def test_login_flow():
    """Test the complete login to dashboard flow"""
    
    print("🧪 TESTING EMERGENCY DASHBOARD LOGIN FLOW")
    print("=" * 50)
    
    # Test 1: Access homepage
    print("\n1️⃣ Testing homepage access...")
    try:
        response = requests.get('https://homeverse-frontend.onrender.com', timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            content = response.text
            if "HomeVerse" in content:
                print("   ✅ HomeVerse branding found")
            if "Emergency Dashboard" in content:
                print("   ✅ Emergency Dashboard found in homepage")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: Access login page
    print("\n2️⃣ Testing login page...")
    try:
        response = requests.get('https://homeverse-frontend.onrender.com/auth/login', timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            content = response.text
            login_found = "login" in content.lower() or "sign in" in content.lower()
            print(f"   Login form: {'✅' if login_found else '❌'}")
            
            # Check for emergency dashboard in login page
            if "Emergency Dashboard" in content:
                print("   ✅ Emergency Dashboard found in login page")
    
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Try dashboard (should redirect to login or show loading)
    print("\n3️⃣ Testing dashboard access (unauthenticated)...")
    try:
        response = requests.get('https://homeverse-frontend.onrender.com/dashboard', 
                              timeout=10, allow_redirects=False)
        print(f"   Status: {response.status_code}")
        
        if response.status_code in [302, 307]:
            print("   ✅ Proper redirect for unauthenticated user")
            redirect_location = response.headers.get('Location', 'unknown')
            print(f"   Redirecting to: {redirect_location}")
            
            if 'login' in redirect_location:
                print("   ✅ Redirecting to login (correct behavior)")
                
        elif response.status_code == 200:
            # Check if it's showing emergency loading
            content = response.text
            if "Emergency Dashboard" in content:
                print("   ✅ Emergency Dashboard loading page shown")
            elif "Loading" in content:
                print("   ✅ Loading page shown (expected)")
            else:
                print("   ⚠️ Dashboard accessible without auth (unexpected)")
    
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 4: Check for console.log patterns in source
    print("\n4️⃣ Checking for emergency console logs...")
    try:
        response = requests.get('https://homeverse-frontend.onrender.com/dashboard', timeout=10)
        
        if response.status_code == 200:
            content = response.text
            console_patterns = [
                "Emergency Dashboard: Starting auth check",
                "Emergency Dashboard",
                "console.log"
            ]
            
            found_patterns = []
            for pattern in console_patterns:
                if pattern in content:
                    found_patterns.append(pattern)
            
            if found_patterns:
                print(f"   ✅ Found patterns: {found_patterns}")
            else:
                print("   ⚠️ No emergency console patterns found in source")
    
    except Exception as e:
        print(f"   ❌ Error: {e}")

def test_backend_connection():
    """Test backend connection"""
    
    print("\n🔗 TESTING BACKEND CONNECTION")
    print("=" * 30)
    
    try:
        response = requests.get('https://homeverse-api.onrender.com', timeout=10)
        print(f"Backend status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Backend response: {data}")
            
            if 'Supabase' in str(data):
                print("✅ Supabase backend confirmed")
    
    except Exception as e:
        print(f"❌ Backend error: {e}")

def main():
    """Run all tests"""
    
    print("🚨 EMERGENCY DASHBOARD VERIFICATION")
    print("This tests the emergency fix for recursive loading")
    print("Commit: f18efab + 267342b (rebuild trigger)")
    print("Expected: Fixed authentication flow with emergency dashboard")
    
    test_login_flow()
    test_backend_connection()
    
    print("\n" + "=" * 60)
    print("🎯 SUMMARY")
    print("The emergency dashboard should:")
    print("  ✅ Show proper loading states")
    print("  ✅ Redirect unauthenticated users to login")
    print("  ✅ Have console logs for debugging")
    print("  ✅ Not get stuck in recursive loading")
    print("\n💡 To test with login:")
    print("  1. Go to: https://homeverse-frontend.onrender.com/auth/login")
    print("  2. Use test credentials: admin@test.com / password123")
    print("  3. Should reach dashboard without infinite loading")

if __name__ == "__main__":
    main()