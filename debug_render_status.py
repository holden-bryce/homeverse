#!/usr/bin/env python3
"""
Quick debugging script to check Render deployment status
"""

import requests
import json
from datetime import datetime

def check_service_status():
    """Check both frontend and backend services"""
    
    services = {
        'Frontend': 'https://homeverse-frontend.onrender.com',
        'Backend': 'https://homeverse-api.onrender.com'
    }
    
    print("🔍 Checking Render service status...")
    print("=" * 50)
    
    for name, url in services.items():
        print(f"\n{name}: {url}")
        try:
            response = requests.get(url, timeout=10)
            print(f"  Status Code: {response.status_code}")
            
            if name == 'Backend':
                # Check if it's the supabase backend
                if response.status_code == 200:
                    try:
                        data = response.json()
                        print(f"  Response: {data}")
                    except:
                        print(f"  Response: {response.text[:200]}...")
            else:
                # Frontend - check if we get HTML back
                if response.status_code == 200:
                    content = response.text[:300]
                    if "Emergency Dashboard" in content:
                        print("  ✅ Emergency Dashboard version is live!")
                    elif "Dashboard" in content or "HomeVerse" in content:
                        print("  📄 Frontend is live (checking for Emergency Dashboard...)")
                    else:
                        print(f"  📄 Frontend is live but content unclear: {content[:100]}...")
                else:
                    print(f"  ❌ Frontend not responding properly")
                    
        except requests.RequestException as e:
            print(f"  ❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print(f"Check completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

def check_frontend_specific():
    """Check if the frontend shows emergency dashboard components"""
    
    print("\n🎯 Checking for Emergency Dashboard deployment...")
    
    try:
        # Try to access the frontend
        response = requests.get('https://homeverse-frontend.onrender.com', timeout=15)
        
        if response.status_code == 200:
            content = response.text
            
            # Check for emergency dashboard markers
            emergency_markers = [
                'Emergency Dashboard: Starting auth check',
                'Emergency Dashboard',
                'f18efab',  # Our commit hash
                'bulletproof'
            ]
            
            found_markers = []
            for marker in emergency_markers:
                if marker in content:
                    found_markers.append(marker)
            
            print(f"Response size: {len(content)} characters")
            print(f"Emergency markers found: {found_markers}")
            
            # Check if it's redirecting to login
            if "login" in content.lower():
                print("✅ Frontend is showing login page (expected if not authenticated)")
            
            # Look for React/Next.js specific content
            if "_next" in content:
                print("✅ Next.js app is being served")
            
            if "homeverse" in content.lower():
                print("✅ HomeVerse branding found")
                
        else:
            print(f"❌ Frontend returned status {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error checking frontend: {e}")

if __name__ == "__main__":
    check_service_status()
    check_frontend_specific()