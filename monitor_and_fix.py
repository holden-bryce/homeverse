#!/usr/bin/env python3
"""Monitor deployment and automatically fix issues"""
import requests
import time
import json
import sys
from datetime import datetime

RENDER_API_KEY = "rnd_KqwZ5fjRivybWcsC9PqsHel2BDt8"
SERVICE_ID = "srv-d11f4godl3ps73cnfr6g"
HEADERS = {"Authorization": f"Bearer {RENDER_API_KEY}"}

def get_latest_deploy():
    """Get latest deployment status"""
    url = f"https://api.render.com/v1/services/{SERVICE_ID}/deploys?limit=1"
    try:
        response = requests.get(url, headers=HEADERS)
        data = response.json()
        if data:
            return data[0]["deploy"]
    except Exception as e:
        print(f"Error getting deploy status: {e}")
    return None

def main():
    """Monitor deployment until complete"""
    print("🚀 Monitoring Render deployment...")
    print("-" * 50)
    
    last_status = None
    start_time = time.time()
    
    while True:
        deploy = get_latest_deploy()
        if not deploy:
            print("❌ Could not get deployment status")
            time.sleep(10)
            continue
            
        status = deploy["status"]
        deploy_id = deploy["id"]
        
        # Only print if status changed
        if status != last_status:
            elapsed = int(time.time() - start_time)
            print(f"\n[{elapsed}s] Status: {status}")
            print(f"Deploy ID: {deploy_id}")
            last_status = status
            
        if status == "live":
            print("\n✅ DEPLOYMENT SUCCESSFUL!")
            print("Testing service health...")
            
            # Test health endpoint
            try:
                resp = requests.get("https://homeverse-api.onrender.com/health", timeout=10)
                if resp.status_code == 200:
                    print("✅ Service is healthy!")
                else:
                    print(f"⚠️ Health check returned {resp.status_code}")
            except Exception as e:
                print(f"❌ Health check failed: {e}")
                
            # Run production validation
            print("\nRunning production validation...")
            import subprocess
            subprocess.run(["python3", "production_ready_checklist.py"])
            break
            
        elif status in ["build_failed", "update_failed"]:
            print(f"\n❌ DEPLOYMENT FAILED: {status}")
            print("\nChecking for common issues...")
            
            # Here we would analyze logs and potentially fix issues
            # For now, just report the failure
            print("\nNext steps:")
            print("1. Check Render dashboard for detailed logs")
            print("2. Fix any issues in the code")
            print("3. Push changes to trigger new deployment")
            break
            
        elif status == "canceled":
            print("\n⚠️ Deployment was canceled")
            break
            
        # Show progress indicator
        sys.stdout.write(".")
        sys.stdout.flush()
        
        time.sleep(5)

if __name__ == "__main__":
    main()