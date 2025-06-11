#!/usr/bin/env python3
"""
Check frontend deployment details
"""

import requests
import re

def check_frontend_content():
    """Get detailed frontend content for debugging"""
    
    print("🔍 Checking frontend content in detail...")
    
    try:
        response = requests.get('https://homeverse-frontend.onrender.com', timeout=15)
        
        if response.status_code == 200:
            content = response.text
            
            print(f"Response size: {len(content)} characters")
            print("\n📄 HTML Content Sample:")
            print("-" * 50)
            print(content[:1000])  # First 1000 chars
            print("-" * 50)
            
            # Look for specific patterns
            patterns = {
                'Next.js Build ID': r'buildId":"([^"]+)"',
                'Script sources': r'src="([^"]*_next[^"]*)"',
                'Emergency Dashboard': r'Emergency Dashboard',
                'Dashboard Layout': r'dashboard[_-]layout',
                'Commit references': r'f18efab|emergency|bulletproof'
            }
            
            print("\n🔍 Pattern Analysis:")
            for name, pattern in patterns.items():
                matches = re.findall(pattern, content, re.IGNORECASE)
                if matches:
                    print(f"  ✅ {name}: {matches[:3]}")  # Show first 3 matches
                else:
                    print(f"  ❌ {name}: Not found")
            
            # Check if we can access the login page directly
            print("\n🔐 Testing login page...")
            login_response = requests.get('https://homeverse-frontend.onrender.com/auth/login', timeout=10)
            print(f"Login page status: {login_response.status_code}")
            
            if login_response.status_code == 200:
                login_content = login_response.text
                if "Emergency Dashboard" in login_content:
                    print("✅ Emergency Dashboard found in login page!")
                else:
                    print("❌ Emergency Dashboard NOT found in login page")
                    
        else:
            print(f"❌ Frontend returned status {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_frontend_content()