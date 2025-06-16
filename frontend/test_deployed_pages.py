#!/usr/bin/env python3
import requests
import time
from datetime import datetime

BASE_URL = "https://homeverse-frontend.onrender.com"

# Pages we expect to work after deployment
test_pages = [
    "/dashboard/profile",
    "/dashboard/buyers/properties", 
    "/dashboard/applicants/new",
    "/dashboard/projects/new"
]

print(f"Testing HomeVerse deployment at {datetime.now()}")
print(f"Base URL: {BASE_URL}")
print("-" * 50)

all_passed = True

for page in test_pages:
    url = f"{BASE_URL}{page}"
    try:
        response = requests.get(url, timeout=10)
        status = response.status_code
        
        if status == 200:
            print(f"✅ {page} - OK ({status})")
        elif status == 404:
            print(f"❌ {page} - NOT FOUND ({status})")
            all_passed = False
        else:
            print(f"⚠️  {page} - Status {status}")
            all_passed = False
            
    except Exception as e:
        print(f"❌ {page} - ERROR: {e}")
        all_passed = False

print("-" * 50)

if all_passed:
    print("✅ All pages are working! Deployment successful.")
else:
    print("❌ Some pages are still 404. Deployment may still be in progress.")
    print("   Render typically takes 5-10 minutes to deploy.")
    print(f"   Current time: {datetime.now()}")
    print("   Try again in a few minutes.")