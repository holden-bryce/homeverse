#!/usr/bin/env python3
"""Test core functionality before cleanup to ensure nothing breaks"""

import requests
import json
import sys
from datetime import datetime

# Configuration
API_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

# Test accounts
TEST_ACCOUNTS = [
    {"email": "developer@test.com", "password": "password123", "role": "developer"},
    {"email": "lender@test.com", "password": "password123", "role": "lender"},
    {"email": "buyer@test.com", "password": "password123", "role": "buyer"},
    {"email": "applicant@test.com", "password": "password123", "role": "applicant"},
    {"email": "admin@test.com", "password": "password123", "role": "admin"}
]

def test_login(email, password, expected_role):
    """Test login functionality"""
    try:
        response = requests.post(f"{API_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login successful for {expected_role}: {email}")
            return data.get("access_token")
        else:
            print(f"❌ Login failed for {expected_role}: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Login error for {expected_role}: {e}")
        return None

def test_projects(token):
    """Test project operations"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get projects
    try:
        response = requests.get(f"{API_URL}/api/v1/projects", headers=headers)
        if response.status_code == 200:
            projects = response.json()
            print(f"✅ Get projects successful: {len(projects)} projects found")
            return True
        else:
            print(f"❌ Get projects failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Get projects error: {e}")
        return False

def test_applications(token):
    """Test application operations"""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{API_URL}/api/v1/applications", headers=headers)
        if response.status_code == 200:
            data = response.json()
            apps = data.get("data", [])
            print(f"✅ Get applications successful: {len(apps)} applications found")
            return True
        else:
            print(f"❌ Get applications failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Get applications error: {e}")
        return False

def check_backend_health():
    """Check if backend is running"""
    try:
        response = requests.get(f"{API_URL}/api/v1/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running")
            return True
        else:
            print("❌ Backend health check failed")
            return False
    except:
        print("❌ Backend is not running at http://localhost:8000")
        print("   Please start it with: python supabase_backend.py")
        return False

def check_frontend_health():
    """Check if frontend is running"""
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is running")
            return True
        else:
            print("❌ Frontend health check failed")
            return False
    except:
        print("❌ Frontend is not running at http://localhost:3000")
        print("   Please start it with: cd frontend && npm run dev")
        return False

def main():
    print("🔍 Testing Core Functionality Before Cleanup")
    print("=" * 50)
    
    # Check services
    print("\n1️⃣ Checking Services...")
    backend_ok = check_backend_health()
    frontend_ok = check_frontend_health()
    
    if not backend_ok:
        print("\n⚠️  Please start the backend first!")
        return False
    
    # Test authentication
    print("\n2️⃣ Testing Authentication...")
    all_auth_ok = True
    tokens = {}
    
    for account in TEST_ACCOUNTS:
        token = test_login(account["email"], account["password"], account["role"])
        if token:
            tokens[account["role"]] = token
        else:
            all_auth_ok = False
    
    # Test core operations
    print("\n3️⃣ Testing Core Operations...")
    
    # Test with developer token
    if "developer" in tokens:
        print("\nTesting developer operations:")
        test_projects(tokens["developer"])
        test_applications(tokens["developer"])
    
    # Summary
    print("\n📊 Summary:")
    print(f"   Backend: {'✅ Running' if backend_ok else '❌ Not running'}")
    print(f"   Frontend: {'✅ Running' if frontend_ok else '❌ Not running'}")
    print(f"   Authentication: {'✅ All working' if all_auth_ok else '❌ Some failed'}")
    print(f"   Total accounts tested: {len(tokens)}/{len(TEST_ACCOUNTS)}")
    
    if backend_ok and all_auth_ok:
        print("\n✅ All core functionality is working!")
        print("   Safe to proceed with cleanup.")
        return True
    else:
        print("\n❌ Some functionality is not working!")
        print("   Fix issues before proceeding with cleanup.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)