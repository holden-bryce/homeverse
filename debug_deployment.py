#!/usr/bin/env python3
"""Debug why deployment changes aren't taking effect"""

import requests
import time
from datetime import datetime

def check_deployment_status():
    """Check various indicators of deployment status"""
    print("🔍 Debugging Deployment Status\n")
    
    # Check frontend
    try:
        response = requests.get("https://homeverse-frontend.onrender.com", timeout=10)
        print(f"✅ Frontend Status: {response.status_code}")
        
        # Check for specific content that would indicate new deployment
        content = response.text
        if "Dashboard Clean Debug" in content:
            print("✅ New dashboard code is deployed")
        elif "Dashboard Fixed Debug" in content:
            print("⚠️  Old dashboard code still deployed")
        elif "Dashboard: Session check" in content:
            print("⚠️  Even older dashboard code still deployed")
        else:
            print("❓ Can't determine dashboard version")
            
    except Exception as e:
        print(f"❌ Frontend Error: {e}")

    # Check backend
    try:
        response = requests.get("https://homeverse-api.onrender.com/health", timeout=10)
        print(f"✅ Backend Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Backend Error: {e}")

def check_git_status():
    """Check what we actually committed"""
    import subprocess
    
    print("\n📝 Recent Git Commits:")
    result = subprocess.run(['git', 'log', '--oneline', '-5'], 
                          capture_output=True, text=True, cwd='/mnt/c/Users/12486/homeverse')
    print(result.stdout)

def troubleshoot_issues():
    """Provide troubleshooting steps"""
    print("\n🔧 Possible Issues & Solutions:\n")
    
    print("1. **Build Failed on Render**:")
    print("   - Check Render dashboard for build logs")
    print("   - Look for TypeScript or build errors")
    print("   - Verify environment variables are set")
    
    print("\n2. **Browser Cache**:")
    print("   - Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)")
    print("   - Try incognito/private browsing mode")
    print("   - Clear browser cache completely")
    
    print("\n3. **Render CDN Cache**:")
    print("   - Render might be serving cached version")
    print("   - Can take 5-15 minutes for CDN to update")
    print("   - Check Render dashboard for actual deployment time")
    
    print("\n4. **Code Issues**:")
    print("   - TypeScript errors preventing build")
    print("   - Missing dependencies")
    print("   - React hooks order issues")
    
    print("\n5. **Environment Variables**:")
    print("   - NEXT_PUBLIC_SUPABASE_URL missing")
    print("   - NEXT_PUBLIC_SUPABASE_ANON_KEY missing")
    print("   - Check Render environment tab")

def check_specific_errors():
    """Check for specific error patterns"""
    print("\n❓ What are you seeing exactly?")
    print("A. Blank white page")
    print("B. Infinite loading spinner") 
    print("C. Error message")
    print("D. Old version of the site")
    print("E. Can't reach login page")
    
    print("\nFor each:")
    print("A. Blank page = JavaScript error, check console")
    print("B. Loading spinner = Auth provider stuck, need different approach")
    print("C. Error message = Check console for specifics")
    print("D. Old version = Cache issue or build didn't deploy")
    print("E. Can't reach login = Routing/middleware issue")

if __name__ == "__main__":
    print("="*60)
    print("DEPLOYMENT DEBUG ANALYSIS")
    print("="*60)
    
    check_deployment_status()
    check_git_status()
    troubleshoot_issues()
    check_specific_errors()
    
    print(f"\n🕐 Current time: {datetime.now()}")
    print("📌 Last commit was pushed ~10 minutes ago")
    print("⏱️  Render deployments typically take 5-15 minutes")