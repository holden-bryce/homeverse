#!/usr/bin/env python3
"""
Quick API-based initialization using the existing endpoint
"""

import requests
import time

def wait_for_deployment():
    """Wait for the new endpoint to be available"""
    print("⏳ Waiting for deployment to complete...")
    
    for i in range(20):  # Wait up to 10 minutes
        try:
            response = requests.get("https://homeverse-api.onrender.com/health", timeout=5)
            if response.status_code == 200:
                # Check if new endpoint exists
                test_response = requests.post(
                    "https://homeverse-api.onrender.com/api/init-db-simple",
                    json={"secret": "wrong-secret"},
                    timeout=5
                )
                if test_response.status_code == 403:  # Endpoint exists but wrong secret
                    print("✅ New endpoint is deployed!")
                    return True
                elif test_response.status_code == 404:
                    print(f"Endpoint not ready yet... ({i*30}/600 seconds)")
                else:
                    print(f"Unexpected response: {test_response.status_code}")
        except:
            pass
        
        time.sleep(30)
    
    return False

def initialize_via_api():
    """Initialize using the simple API endpoint"""
    print("\n🔧 Initializing database via API...")
    
    payload = {
        "secret": "homeverse-2024",
        "users": [
            {"email": "developer@test.com", "password": "password123", "role": "developer"},
            {"email": "lender@test.com", "password": "password123", "role": "lender"},
            {"email": "buyer@test.com", "password": "password123", "role": "buyer"},
            {"email": "applicant@test.com", "password": "password123", "role": "applicant"},
            {"email": "admin@test.com", "password": "password123", "role": "admin"}
        ]
    }
    
    try:
        response = requests.post(
            "https://homeverse-api.onrender.com/api/init-db-simple",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {data.get('message', 'Success!')}")
            print(f"Company ID: {data.get('company_id')}")
            print(f"Users created: {data.get('users_created')}")
            return True
        else:
            print(f"❌ Failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_login():
    """Test authentication after initialization"""
    print("\n🧪 Testing authentication...")
    
    try:
        response = requests.post(
            "https://homeverse-api.onrender.com/api/v1/auth/login",
            json={"email": "developer@test.com", "password": "password123"},
            timeout=5
        )
        
        if response.status_code == 200:
            print("✅ Authentication working!")
            return True
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing auth: {e}")
        return False

def main():
    print("🚀 HomeVerse Quick API Initialization")
    print("="*50)
    
    # Wait for deployment if needed
    if not wait_for_deployment():
        print("\n❌ Deployment timeout - endpoint not available")
        print("\nAlternative: Use the manual initialization script")
        print("See: manual_db_init.py")
        return
    
    # Initialize database
    if initialize_via_api():
        # Test authentication
        time.sleep(2)
        if test_login():
            print("\n🎉 SUCCESS! Database initialized and authentication working!")
            print("\nTest at: https://homeverse-frontend.onrender.com/auth/login")
            print("\nCredentials:")
            print("- developer@test.com / password123")
            print("- lender@test.com / password123")
            print("- buyer@test.com / password123")
            print("- applicant@test.com / password123")
            print("- admin@test.com / password123")
        else:
            print("\n⚠️ Database initialized but authentication not working")
            print("Try again in a few seconds")
    else:
        print("\n❌ Initialization failed")
        print("Use manual method: See manual_db_init.py")

if __name__ == "__main__":
    main()