#!/usr/bin/env python3
"""Check production deployment status and configuration"""
import requests
import json
from datetime import datetime

print("🔍 HomeVerse Production Status Check")
print("=" * 60)
print(f"Time: {datetime.now().isoformat()}")
print()

# Backend API endpoints to check
BACKEND_URL = "https://homeverse-api.onrender.com"
FRONTEND_URL = "https://homeverse-frontend.onrender.com"

def check_endpoint(name, url, expected_status=200):
    """Check if an endpoint is accessible"""
    try:
        response = requests.get(url, timeout=10)
        status = "✅" if response.status_code == expected_status else "❌"
        print(f"{status} {name}: {url}")
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"   Response: {json.dumps(data, indent=2)[:200]}...")
            except:
                print(f"   Response: {response.text[:200]}...")
        return response.status_code == expected_status
    except requests.exceptions.Timeout:
        print(f"⏱️ {name}: TIMEOUT - {url}")
        return False
    except Exception as e:
        print(f"❌ {name}: ERROR - {url}")
        print(f"   Error: {str(e)}")
        return False

print("1. Backend API Checks")
print("-" * 40)

# Check backend health
check_endpoint("Backend Root", f"{BACKEND_URL}/")
check_endpoint("Backend Health", f"{BACKEND_URL}/health")
check_endpoint("Backend API Docs", f"{BACKEND_URL}/docs", expected_status=200)

print()
print("2. Frontend Checks")
print("-" * 40)

# Check frontend
check_endpoint("Frontend Homepage", FRONTEND_URL)

print()
print("3. CORS Test")
print("-" * 40)

# Test CORS headers
try:
    headers = {
        'Origin': FRONTEND_URL,
        'Content-Type': 'application/json'
    }
    response = requests.options(
        f"{BACKEND_URL}/api/v1/auth/login",
        headers=headers,
        timeout=10
    )
    
    cors_headers = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin', 'Not set'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods', 'Not set'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers', 'Not set'),
        'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials', 'Not set')
    }
    
    print("CORS Headers from Backend:")
    for header, value in cors_headers.items():
        print(f"  {header}: {value}")
    
    # Check if CORS is properly configured
    if cors_headers['Access-Control-Allow-Origin'] in ['*', FRONTEND_URL]:
        print("✅ CORS appears to be configured correctly")
    else:
        print("❌ CORS may not be configured correctly")
        
except Exception as e:
    print(f"❌ CORS test failed: {str(e)}")

print()
print("4. Authentication Test")
print("-" * 40)

# Test login endpoint
try:
    login_data = {
        "email": "admin@test.com",
        "password": "password123"
    }
    
    response = requests.post(
        f"{BACKEND_URL}/api/v1/auth/login",
        json=login_data,
        headers={'Content-Type': 'application/json'},
        timeout=10
    )
    
    if response.status_code == 200:
        print("✅ Login endpoint is accessible")
        data = response.json()
        if 'access_token' in data:
            print("✅ Login returns access token")
        else:
            print("❌ Login response missing access token")
            print(f"   Response: {json.dumps(data, indent=2)}")
    else:
        print(f"❌ Login failed with status {response.status_code}")
        print(f"   Response: {response.text[:500]}")
        
except Exception as e:
    print(f"❌ Authentication test failed: {str(e)}")

print()
print("5. Summary")
print("-" * 40)
print("If you see errors above, possible issues:")
print("1. Backend may not be fully deployed or started")
print("2. CORS configuration may be incorrect")
print("3. Supabase environment variables may be missing")
print("4. Frontend may not be configured with correct backend URL")
print()
print("Check Render logs for more details:")
print(f"  Backend: https://dashboard.render.com/web/{BACKEND_URL.split('//')[1].split('.')[0]}")
print(f"  Frontend: https://dashboard.render.com/static/{FRONTEND_URL.split('//')[1].split('.')[0]}")