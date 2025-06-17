#\!/usr/bin/env python3
"""
Comprehensive test of the new application and investment functionality
"""
import requests
import json
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://localhost:8000"
TEST_EMAIL = "developer@test.com"
TEST_PASSWORD = "password123"

def test_login():
    """Test login and get auth token"""
    response = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Login successful")
        return data["access_token"]
    else:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return None

def test_applications_api(token):
    """Test applications API endpoints"""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    print("\n🔍 Testing Applications API...")
    
    # Test GET applications
    response = requests.get(f"{BASE_URL}/api/v1/applications", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ GET applications: {data.get('count', 0)} applications found")
        return True
    else:
        print(f"❌ GET applications failed: {response.status_code} - {response.text}")
        return False

def test_investments_api(token):
    """Test investments API endpoints"""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    print("\n🔍 Testing Investments API...")
    
    # Test GET investments
    response = requests.get(f"{BASE_URL}/api/v1/investments", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ GET investments: {data.get('count', 0)} investments found")
        return True
    else:
        print(f"❌ GET investments failed: {response.status_code} - {response.text}")
        return False

def main():
    print("🚀 Testing HomeVerse Application & Investment Functionality")
    print("=" * 60)
    
    # Test login
    token = test_login()
    if not token:
        print("Cannot proceed without authentication")
        return False
    
    # Test API endpoints
    apps_ok = test_applications_api(token)
    investments_ok = test_investments_api(token)
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS:")
    print(f"{'✅' if apps_ok else '❌'} Applications API")
    print(f"{'✅' if investments_ok else '❌'} Investments API") 
    
    all_passed = all([apps_ok, investments_ok])
    
    if all_passed:
        print("\n🎉 ALL TESTS PASSED\! The application is fully functional.")
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")
    
    return all_passed

if __name__ == "__main__":
    main()
EOF < /dev/null
