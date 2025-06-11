#!/usr/bin/env python3
"""Debug the live frontend auth issue"""

import requests
import json

def check_frontend_auth():
    """Test the frontend auth flow"""
    print("🔍 Debugging Live Frontend Auth Issue\n")
    
    # Check if frontend is up
    try:
        response = requests.get("https://homeverse-frontend.onrender.com", timeout=10)
        print(f"✅ Frontend is up: {response.status_code}")
    except Exception as e:
        print(f"❌ Frontend error: {e}")
        return
    
    # Check backend health
    try:
        response = requests.get("https://homeverse-api.onrender.com/health", timeout=10)
        print(f"✅ Backend is up: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Backend error: {e}")
    
    print("\n📋 Current Situation:")
    print("- Frontend loads but sidebar is not showing")
    print("- Same console errors about profile loading")
    print("- Auth state not reaching dashboard component")
    
    print("\n🔧 Possible Issues:")
    print("1. The deployment might not have completed yet")
    print("2. Build cache might be serving old code")
    print("3. The auth provider changes might not be working as expected")
    
    print("\n🎯 Quick Debug Steps:")
    print("1. Check the browser console for the exact error")
    print("2. Look for 'Dashboard Layout Debug' logs")
    print("3. Check if EMAIL_ROLE_MAP is defined in the auth provider")
    print("4. Verify the user object has an email property")
    
    print("\n💡 Let's try a different approach...")

def create_emergency_fix():
    """Create an emergency fix that definitely works"""
    print("\n🚨 Emergency Fix Approach:\n")
    
    emergency_fix = '''
// In dashboard-layout.tsx, replace the role detection with:

const effectiveRole = (() => {
  // Super simple role detection
  const email = user?.email || profile?.email || session?.user?.email
  
  if (!email) {
    console.log('No email found, defaulting to user role')
    return 'user'
  }
  
  console.log('Determining role for email:', email)
  
  // Direct email to role mapping
  if (email === 'admin@test.com') return 'admin'
  if (email === 'developer@test.com') return 'developer'
  if (email === 'lender@test.com') return 'lender'
  if (email === 'buyer@test.com') return 'buyer'
  if (email === 'applicant@test.com') return 'applicant'
  
  return 'user'
})()

// And make sure navigation always shows something:
const filteredNavigation = effectiveRole === 'user' 
  ? [navigation[0]] // At least show Overview
  : navigation.filter(item => !item.roles || item.roles.includes(effectiveRole))
'''
    
    print(emergency_fix)
    
    print("\n🔍 Debug Information Needed:")
    print("1. What exact console error are you seeing?")
    print("2. Is it the 'Profile query timeout' error?")
    print("3. What does the Dashboard Layout Debug log show?")
    print("4. Can you see if the user is logged in (check localStorage)?")

if __name__ == "__main__":
    check_frontend_auth()
    create_emergency_fix()
    
    print("\n📌 Next Steps:")
    print("1. Check deployment logs on Render")
    print("2. Try clearing browser cache and cookies")
    print("3. Try incognito/private browsing mode")
    print("4. Check if the auth token is being set")