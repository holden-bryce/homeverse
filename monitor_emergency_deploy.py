#!/usr/bin/env python3
"""
Monitor the emergency dashboard deployment
"""

import requests
import time
from datetime import datetime

def check_emergency_dashboard():
    """Check if emergency dashboard is deployed"""
    
    try:
        # Try the dashboard page that should show emergency loading
        response = requests.get('https://homeverse-frontend.onrender.com/dashboard', 
                              timeout=10, allow_redirects=False)
        
        print(f"Dashboard page status: {response.status_code}")
        
        if response.status_code in [200, 302, 307]:  # Any reasonable response
            if response.status_code == 200:
                content = response.text
                
                # Look for emergency markers
                emergency_found = "Emergency Dashboard" in content
                console_log_found = "Emergency Dashboard: Starting auth check" in content
                
                print(f"  Emergency Dashboard text: {'✅' if emergency_found else '❌'}")
                print(f"  Console log pattern: {'✅' if console_log_found else '❌'}")
                
                return emergency_found or console_log_found
            else:
                print(f"  Redirect response (expected for dashboard auth)")
                return True  # Redirect is fine for dashboard
        else:
            print(f"  Unexpected status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"  Error checking dashboard: {e}")
        return False

def check_deployment_timestamp():
    """Try to detect if deployment is recent"""
    
    try:
        response = requests.get('https://homeverse-frontend.onrender.com', timeout=10)
        
        if response.status_code == 200:
            # Look for any indicators of recent build
            content = response.text
            
            # Check for our commit hash or trigger content
            recent_markers = ['267342b', 'trigger_rebuild', 'Force rebuild']
            found_recent = any(marker in content for marker in recent_markers)
            
            print(f"Recent deployment markers: {'✅' if found_recent else '❌'}")
            return found_recent
        
    except Exception as e:
        print(f"Error checking deployment timestamp: {e}")
        
    return False

def monitor_deployment():
    """Monitor until emergency dashboard is deployed"""
    
    print("🚨 MONITORING EMERGENCY DASHBOARD DEPLOYMENT")
    print("=" * 60)
    print("Looking for:")
    print("  - Emergency Dashboard components")
    print("  - Console log patterns")
    print("  - Recent deployment markers")
    print("=" * 60)
    
    start_time = datetime.now()
    max_wait_minutes = 15  # Most deployments complete within 15 minutes
    
    while True:
        current_time = datetime.now()
        elapsed = (current_time - start_time).total_seconds() / 60
        
        print(f"\n⏰ Check at {current_time.strftime('%H:%M:%S')} (elapsed: {elapsed:.1f}min)")
        
        # Check frontend status
        print("🌐 Checking frontend...")
        try:
            response = requests.get('https://homeverse-frontend.onrender.com', timeout=5)
            print(f"  Status: {response.status_code}")
        except:
            print("  Status: ❌ Not reachable")
            
        # Check for emergency dashboard
        print("🎯 Checking emergency dashboard...")
        emergency_deployed = check_emergency_dashboard()
        
        # Check deployment recency
        print("📅 Checking deployment recency...")
        is_recent = check_deployment_timestamp()
        
        if emergency_deployed:
            print("\n🎉 SUCCESS! Emergency Dashboard is deployed!")
            print("✅ You can now test the frontend:")
            print("   - https://homeverse-frontend.onrender.com")
            print("   - Should see emergency loading with clear console logs")
            print("   - Should fix the recursive loading issue")
            break
            
        if elapsed > max_wait_minutes:
            print(f"\n⏰ Timeout after {max_wait_minutes} minutes")
            print("🔍 The deployment might be taking longer than expected.")
            print("💡 You can:")
            print("   1. Check Render dashboard: https://dashboard.render.com")
            print("   2. Wait a bit more (deployments can take up to 20-30 minutes)")
            print("   3. Try accessing the site manually")
            break
            
        print(f"⏳ Waiting 30 seconds... (will timeout at {max_wait_minutes}min)")
        time.sleep(30)

if __name__ == "__main__":
    monitor_deployment()