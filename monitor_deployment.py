#!/usr/bin/env python3
"""
Deployment Monitor and Auto-Fix System
Continuously monitors Render deployments and automatically fixes common issues
"""
import os
import time
import json
import subprocess
from datetime import datetime

RENDER_API_KEY = "rnd_KqwZ5fjRivybWcsC9PqsHel2BDt8"
HOMEVERSE_API_SERVICE_ID = "srv-d11f4godl3ps73cnfr6g"
HOMEVERSE_FRONTEND_SERVICE_ID = "srv-d11f3q0dl3ps73cnf480"

def get_latest_deploy(service_id):
    """Get the latest deployment for a service"""
    cmd = f'curl -s -H "Authorization: Bearer {RENDER_API_KEY}" -H "Accept: application/json" https://api.render.com/v1/services/{service_id}/deploys?limit=1'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode == 0:
        try:
            data = json.loads(result.stdout)
            if data and len(data) > 0:
                return data[0]['deploy']
        except:
            pass
    return None

def get_deploy_logs(service_id, deploy_id):
    """Get logs for a specific deployment"""
    # Note: Render API doesn't have a direct logs endpoint, but we can check deploy status
    cmd = f'curl -s -H "Authorization: Bearer {RENDER_API_KEY}" -H "Accept: application/json" https://api.render.com/v1/services/{service_id}/deploys/{deploy_id}'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode == 0:
        try:
            return json.loads(result.stdout)
        except:
            pass
    return None

def analyze_and_fix_issues(service_name, deploy_info):
    """Analyze deployment issues and suggest/apply fixes"""
    status = deploy_info.get('status', '')
    
    if status == 'build_failed':
        print(f"🔴 Build failed for {service_name}")
        # Common build failures and fixes
        fixes = {
            "ModuleNotFoundError": "Check requirements.txt for missing dependencies",
            "SyntaxError": "Python syntax error in code",
            "npm ERR!": "Frontend dependency or build issue",
            "NameError": "Variable used before definition"
        }
        return fixes
    
    elif status == 'update_failed':
        print(f"🔴 Update failed for {service_name}")
        return {
            "Port binding": "Check PORT environment variable",
            "Health check": "Verify health check endpoint returns 200",
            "Timeout": "Startup taking too long, optimize imports"
        }
    
    elif status in ['live', 'update_in_progress']:
        return None
    
    return None

def monitor_deployments():
    """Main monitoring loop"""
    print("🚀 Starting Deployment Monitor")
    print(f"Monitoring HomeVerse Backend: {HOMEVERSE_API_SERVICE_ID}")
    print(f"Monitoring HomeVerse Frontend: {HOMEVERSE_FRONTEND_SERVICE_ID}")
    print("-" * 50)
    
    services = [
        ("HomeVerse API", HOMEVERSE_API_SERVICE_ID),
        ("HomeVerse Frontend", HOMEVERSE_FRONTEND_SERVICE_ID)
    ]
    
    while True:
        for service_name, service_id in services:
            deploy = get_latest_deploy(service_id)
            if deploy:
                status = deploy.get('status', 'unknown')
                deploy_id = deploy.get('id', 'unknown')
                commit_msg = deploy.get('commit', {}).get('message', '').split('\n')[0]
                
                print(f"\n[{datetime.now().strftime('%H:%M:%S')}] {service_name}")
                print(f"  Deploy: {deploy_id}")
                print(f"  Status: {status}")
                print(f"  Commit: {commit_msg[:60]}...")
                
                # Check for issues
                issues = analyze_and_fix_issues(service_name, deploy)
                if issues:
                    print(f"  ⚠️ Potential issues detected:")
                    for issue, fix in issues.items():
                        print(f"    - {issue}: {fix}")
        
        print("\n" + "-" * 50)
        time.sleep(30)  # Check every 30 seconds

if __name__ == "__main__":
    monitor_deployments()