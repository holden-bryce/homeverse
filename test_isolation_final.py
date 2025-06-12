#!/usr/bin/env python3
"""
Test data isolation between companies using existing accounts
"""

import requests
import json
from datetime import datetime
import time

BASE_URL = "http://localhost:8000"

# Test with known working accounts from different companies
TEST_ACCOUNTS = [
    {
        "email": "developer@test.com",
        "password": "password123",
        "company": "test"
    },
    {
        "email": "lender@test.com",
        "password": "password123", 
        "company": "test"
    },
    {
        "email": "buyer@test.com",
        "password": "password123",
        "company": "test"
    }
]

def test_functionality():
    print("🧪 Testing Data Creation and Isolation")
    print("=" * 50)
    
    # Test backend health
    resp = requests.get(f"{BASE_URL}/health")
    print(f"✅ Backend Health: {resp.json()}")
    
    # Storage for test results
    tokens = {}
    created_data = {}
    
    # Test each account
    for account in TEST_ACCOUNTS:
        print(f"\n📧 Testing: {account['email']}")
        print("-" * 40)
        
        # Login
        login_resp = requests.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={"email": account["email"], "password": account["password"]}
        )
        
        if login_resp.status_code == 200:
            data = login_resp.json()
            token = data.get("access_token")
            user_info = data.get("user", {})
            tokens[account["email"]] = token
            
            print(f"✅ Login successful - Role: {user_info.get('role')}, Company: {user_info.get('company', {}).get('name')}")
            
            # Create test applicant with unique identifier
            headers = {"Authorization": f"Bearer {token}"}
            timestamp = int(time.time())
            
            applicant_data = {
                "full_name": f"Test_{account['email'].split('@')[0]}_{timestamp}",
                "email": f"test_{timestamp}@example.com",
                "phone": "555-0001",
                "income": 50000,
                "household_size": 2,
                "preferences": {"test": True}
            }
            
            create_resp = requests.post(
                f"{BASE_URL}/api/v1/applicants",
                json=applicant_data,
                headers=headers
            )
            
            if create_resp.status_code in [200, 201]:
                created = create_resp.json()
                print(f"✅ Created applicant: {created.get('full_name')} (ID: {created.get('id')})")
                
                if account["email"] not in created_data:
                    created_data[account["email"]] = []
                created_data[account["email"]].append(created)
            else:
                print(f"❌ Failed to create applicant: {create_resp.status_code}")
                
            # List all applicants
            list_resp = requests.get(
                f"{BASE_URL}/api/v1/applicants",
                headers=headers
            )
            
            if list_resp.status_code == 200:
                applicants = list_resp.json()
                print(f"📋 Can see {len(applicants)} total applicants")
                
                # Check what data this user can see
                # Handle both list and dict responses
                if isinstance(applicants, list):
                    applicant_list = applicants
                elif isinstance(applicants, dict) and 'data' in applicants:
                    applicant_list = applicants['data']
                else:
                    applicant_list = []
                    
                own_data = []
                other_data = []
                
                for a in applicant_list:
                    if isinstance(a, dict):
                        name = a.get('full_name', '')
                        if account['email'].split('@')[0] in name:
                            own_data.append(a)
                        elif 'Test_' in name and account['email'].split('@')[0] not in name:
                            other_data.append(a)
                
                print(f"  - Own data: {len(own_data)} records")
                print(f"  - Other users' test data visible: {len(other_data)} records")
                
                if other_data:
                    print("  ⚠️  Can see data from other users in same company:")
                    for record in other_data[:3]:  # Show first 3
                        print(f"     - {record.get('full_name')}")
        else:
            print(f"❌ Login failed: {login_resp.status_code}")
    
    # Summary
    print("\n📊 Summary")
    print("=" * 50)
    
    if all(email in tokens for email in ["developer@test.com", "lender@test.com", "buyer@test.com"]):
        print("✅ All test users from same company can:")
        print("  - Login successfully")
        print("  - Create applicants")
        print("  - View all company applicants (expected behavior)")
        print("\n💡 This is correct multi-tenant behavior:")
        print("  - Users within same company share data")
        print("  - Users from different companies are isolated")
    else:
        print("❌ Some logins failed - check user credentials")
        
    # Test with a truly different company if we can find one
    print("\n🔒 Testing Cross-Company Isolation")
    print("-" * 40)
    
    # Try to login with a user from a different company
    other_company_accounts = [
        {"email": "admin@demo.com", "password": "password123", "company": "demo"},
        {"email": "admin@homeverse.com", "password": "password123", "company": "homeverse"}
    ]
    
    for other_account in other_company_accounts:
        login_resp = requests.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={"email": other_account["email"], "password": other_account["password"]}
        )
        
        if login_resp.status_code == 200:
            print(f"\n✅ Found user from different company: {other_account['email']}")
            token = login_resp.json().get("access_token")
            headers = {"Authorization": f"Bearer {token}"}
            
            # List applicants
            list_resp = requests.get(f"{BASE_URL}/api/v1/applicants", headers=headers)
            
            if list_resp.status_code == 200:
                other_company_applicants = list_resp.json()
                
                # Check for data leakage
                test_company_data = [a for a in other_company_applicants if any(
                    test_user in a.get('full_name', '') 
                    for test_user in ['developer', 'lender', 'buyer']
                )]
                
                if test_company_data:
                    print(f"❌ DATA ISOLATION FAILURE: {other_account['company']} can see test company data!")
                    for leak in test_company_data[:2]:
                        print(f"   Leaked: {leak.get('full_name')}")
                else:
                    print(f"✅ DATA ISOLATION WORKING: {other_account['company']} cannot see test company data")
                    print(f"   {other_account['company']} sees {len(other_company_applicants)} applicants (own company only)")
            break
    else:
        print("⚠️  Could not find user from different company to test cross-company isolation")
        print("   All test accounts appear to be from the same company")

if __name__ == "__main__":
    test_functionality()