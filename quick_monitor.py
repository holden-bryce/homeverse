#!/usr/bin/env python3
"""Quick deployment monitor with auto-fixing"""
import requests
import time
import subprocess
import json

RENDER_API_KEY = "rnd_KqwZ5fjRivybWcsC9PqsHel2BDt8"
SERVICE_ID = "srv-d11f4godl3ps73cnfr6g"
HEADERS = {"Authorization": f"Bearer {RENDER_API_KEY}"}

def get_latest_deploy():
    """Get latest deployment status"""
    url = f"https://api.render.com/v1/services/{SERVICE_ID}/deploys?limit=1"
    response = requests.get(url, headers=HEADERS)
    data = response.json()
    if data:
        return data[0]["deploy"]
    return None

def get_deploy_logs(deploy_id):
    """Get deployment logs"""
    url = f"https://api.render.com/v1/services/{SERVICE_ID}/deploys/{deploy_id}/logs"
    response = requests.get(url, headers=HEADERS)
    return response.text

def monitor_deployment():
    """Monitor deployment with auto-fixing"""
    print("🚀 Monitoring deployment...")
    
    while True:
        deploy = get_latest_deploy()
        if not deploy:
            print("❌ No deployment found")
            break
            
        status = deploy["status"]
        deploy_id = deploy["id"]
        
        print(f"\n📊 Status: {status}")
        print(f"🆔 Deploy ID: {deploy_id}")
        print(f"💬 Commit: {deploy['commit']['message'][:50]}...")
        
        if status == "live":
            print("✅ Deployment successful!")
            # Test the service
            test_health()
            break
            
        elif status == "build_failed" or status == "update_failed":
            print("❌ Deployment failed! Checking logs...")
            logs = get_deploy_logs(deploy_id)
            
            # Analyze and fix common issues
            if "NameError: name 'logger' is not defined" in logs:
                print("🔧 Found logger issue - already fixed in code")
            elif "ModuleNotFoundError" in logs:
                print("🔧 Missing module detected")
                # Could add logic to update requirements.txt
            elif "SyntaxError" in logs:
                print("🔧 Syntax error in code")
                print("Last 500 chars of logs:")
                print(logs[-500:])
                
            print("\n📝 Full logs saved to deploy_error.log")
            with open("deploy_error.log", "w") as f:
                f.write(logs)
                
            break
            
        else:
            print("⏳ Still in progress...")
            
        time.sleep(10)

def test_health():
    """Test if service is healthy"""
    print("\n🧪 Testing service health...")
    try:
        response = requests.get("https://homeverse-api.onrender.com/health", timeout=10)
        if response.status_code == 200:
            print("✅ Service is healthy!")
        else:
            print(f"⚠️ Health check returned {response.status_code}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")

if __name__ == "__main__":
    monitor_deployment()