#!/usr/bin/env python3
"""
Check if emergency components are loaded locally
"""

import requests
import re

def check_login_page():
    """Check login page for emergency components"""
    
    print("🔍 CHECKING LOCAL LOGIN PAGE")
    print("=" * 40)
    
    try:
        response = requests.get('http://localhost:3000/auth/login', timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Login page returned status: {response.status_code}")
            return False
            
        content = response.text
        
        # Check for emergency markers
        checks = {
            "Page Title 'Emergency Login'": bool(re.search(r'Emergency Login', content)),
            "Test Credentials Section": bool(re.search(r'Test Credentials', content)),
            "admin@test.com in credentials": bool(re.search(r'admin@test\.com.*password123', content, re.DOTALL)),
            "Emergency form component": bool(re.search(r'EmergencyLoginForm|Emergency Login: Form loaded', content)),
            "supabase-emergency import": bool(re.search(r'supabase-emergency', content)),
            "Sign in button": bool(re.search(r'Sign in|Signing in', content)),
            "HomeVerse branding": bool(re.search(r'HomeVerse|homeverse', content, re.IGNORECASE))
        }
        
        # Print results
        emergency_found = False
        for check, result in checks.items():
            status = "✅" if result else "❌"
            print(f"{status} {check}")
            if "Emergency" in check and result:
                emergency_found = True
        
        # Check what we actually have
        if not emergency_found:
            # Look for old login form
            if re.search(r'Sign in to your account', content):
                print("\n⚠️ OLD LOGIN FORM DETECTED - Emergency changes not loaded!")
                print("The frontend is still showing the old login form.")
                
            # Check for any build info
            build_match = re.search(r'buildId["\']:\s*["\']([\w-]+)', content)
            if build_match:
                print(f"\nBuild ID: {build_match.group(1)}")
        
        # Save for debugging
        with open('/tmp/local_login_page.html', 'w') as f:
            f.write(content)
            print(f"\nSaved page content to: /tmp/local_login_page.html")
            
        return emergency_found
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to localhost:3000")
        print("Is the frontend running?")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def check_dashboard():
    """Check dashboard for emergency components"""
    
    print("\n🔍 CHECKING LOCAL DASHBOARD")
    print("=" * 40)
    
    try:
        response = requests.get('http://localhost:3000/dashboard', timeout=10, allow_redirects=False)
        
        print(f"Dashboard status: {response.status_code}")
        
        if response.status_code in [301, 302, 307]:
            location = response.headers.get('Location', 'unknown')
            print(f"Redirects to: {location}")
            
            if '/auth/login' in location:
                print("✅ Correctly redirecting unauthenticated users to login")
                
        elif response.status_code == 200:
            content = response.text
            if "Emergency Dashboard" in content:
                print("✅ Emergency Dashboard component found!")
            else:
                print("❌ Emergency Dashboard not found")
                
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """Run checks"""
    
    print("🏠 LOCAL EMERGENCY COMPONENTS CHECK")
    print(f"URL: http://localhost:3000")
    print("=" * 50)
    
    login_ok = check_login_page()
    check_dashboard()
    
    print("\n" + "=" * 50)
    
    if login_ok:
        print("✅ EMERGENCY COMPONENTS ARE LOADED LOCALLY!")
        print("\nYou can now test login at: http://localhost:3000/auth/login")
        print("Use: admin@test.com / password123")
    else:
        print("❌ EMERGENCY COMPONENTS NOT LOADED")
        print("\nPossible reasons:")
        print("1. Frontend not restarted after changes")
        print("2. Build cache not cleared")
        print("3. Wrong branch or uncommitted changes")
        print("\nTry:")
        print("1. Stop frontend (Ctrl+C)")
        print("2. Clear Next.js cache: rm -rf frontend/.next")
        print("3. Restart: cd frontend && npm run dev")

if __name__ == "__main__":
    main()