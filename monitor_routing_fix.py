#!/usr/bin/env python3
"""
Monitor the emergency routing fix deployment
"""

import requests
import time
from datetime import datetime

def check_login_page_access():
    """Check if login page is accessible without routing loops"""
    
    try:
        print("🔐 Testing login page access...")
        response = requests.get('https://homeverse-frontend.onrender.com/auth/login', 
                              timeout=10, allow_redirects=False)
        
        print(f"   Login page status: {response.status_code}")
        
        if response.status_code == 200:
            content = response.text
            
            # Look for emergency login markers
            emergency_login = "Emergency Login" in content
            emergency_loaded = "Emergency Login: Page component loaded" in content
            
            print(f"   Emergency Login text: {'✅' if emergency_login else '❌'}")
            print(f"   Emergency console logs: {'✅' if emergency_loaded else '❌'}")
            
            # Check for test credentials section
            test_creds = "Test Credentials" in content
            print(f"   Test credentials visible: {'✅' if test_creds else '❌'}")
            
            return emergency_login and test_creds
            
        elif response.status_code in [301, 302, 307]:
            redirect_location = response.headers.get('Location', 'unknown')
            print(f"   ❌ Unexpected redirect: {redirect_location}")
            return False
        else:
            print(f"   ❌ Unexpected status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error accessing login page: {e}")
        return False

def check_middleware_logs():
    """Check for emergency middleware logs"""
    
    try:
        print("🛣️ Testing middleware behavior...")
        
        # Test dashboard route (should pass through to client)
        response = requests.get('https://homeverse-frontend.onrender.com/dashboard', 
                              timeout=10, allow_redirects=False)
        
        print(f"   Dashboard middleware status: {response.status_code}")
        
        if response.status_code == 200:
            content = response.text
            emergency_middleware = "Emergency Middleware" in content
            emergency_dashboard = "Emergency Dashboard" in content
            
            print(f"   Emergency middleware logs: {'✅' if emergency_middleware else '❌'}")
            print(f"   Emergency dashboard visible: {'✅' if emergency_dashboard else '❌'}")
            
            return emergency_middleware or emergency_dashboard
        elif response.status_code in [301, 302, 307]:
            # Old middleware would redirect here
            print(f"   ⚠️ Still redirecting (old middleware?)")
            return False
        else:
            print(f"   Status: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error testing middleware: {e}")
        
    return False

def test_complete_flow():
    """Test the complete login flow"""
    
    print("\n🧪 TESTING COMPLETE EMERGENCY FLOW")
    print("=" * 50)
    
    # Test 1: Homepage
    print("1️⃣ Testing homepage...")
    try:
        response = requests.get('https://homeverse-frontend.onrender.com', timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Homepage accessible")
    except Exception as e:
        print(f"   ❌ Homepage error: {e}")
    
    # Test 2: Login page
    print("\n2️⃣ Testing login page...")
    login_works = check_login_page_access()
    
    # Test 3: Dashboard (should show emergency loading)
    print("\n3️⃣ Testing dashboard...")
    dashboard_works = check_middleware_logs()
    
    return login_works and dashboard_works

def monitor_routing_fix():
    """Monitor until routing fix is deployed"""
    
    print("🚨 MONITORING EMERGENCY ROUTING FIX")
    print("=" * 60)
    print("Expected fixes:")
    print("  - Login page accessible without recursion")
    print("  - Emergency middleware allows all routes")
    print("  - Emergency login form with test credentials")
    print("  - Dashboard shows emergency loading")
    print("=" * 60)
    
    start_time = datetime.now()
    max_wait_minutes = 15
    
    while True:
        current_time = datetime.now()
        elapsed = (current_time - start_time).total_seconds() / 60
        
        print(f"\n⏰ Check at {current_time.strftime('%H:%M:%S')} (elapsed: {elapsed:.1f}min)")
        
        # Test the complete flow
        flow_works = test_complete_flow()
        
        if flow_works:
            print("\n🎉 SUCCESS! Emergency routing fix is deployed!")
            print("✅ You can now access the application:")
            print("   1. Go to: https://homeverse-frontend.onrender.com/auth/login")
            print("   2. You should see 'Emergency Login' form")
            print("   3. Use test credentials: admin@test.com / password123")
            print("   4. Should successfully reach dashboard")
            print("   5. No more recursive loading!")
            break
            
        if elapsed > max_wait_minutes:
            print(f"\n⏰ Timeout after {max_wait_minutes} minutes")
            print("🔍 Deployment might still be in progress.")
            print("💡 You can try accessing the login page manually:")
            print("   https://homeverse-frontend.onrender.com/auth/login")
            break
            
        print(f"\n⏳ Waiting 30 seconds before next check...")
        time.sleep(30)

if __name__ == "__main__":
    monitor_routing_fix()