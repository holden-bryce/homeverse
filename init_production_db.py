#!/usr/bin/env python3
"""Initialize production database using the temporary endpoint"""
import requests
import time
import json

API_URL = "https://homeverse-api.onrender.com"

def wait_for_deployment():
    """Wait for deployment to complete"""
    print("⏳ Waiting for deployment to complete...")
    
    for i in range(30):  # Wait up to 5 minutes
        try:
            response = requests.get(f"{API_URL}/health", timeout=5)
            if response.status_code == 200:
                print("✅ Service is healthy!")
                return True
        except:
            pass
        
        print(f"Waiting... ({i*10}/300 seconds)")
        time.sleep(10)
    
    return False

def initialize_database():
    """Call the initialization endpoint"""
    print("\n🔧 Initializing database...")
    
    try:
        response = requests.post(
            f"{API_URL}/api/init-db-2024-temp",
            params={"secret": "homeverse-init-2024"},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {data['message']}")
            if 'company_id' in data:
                print(f"Company ID: {data['company_id']}")
                print(f"Users created: {data['users_created']}")
            return True
        else:
            print(f"❌ Initialization failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_authentication():
    """Test if authentication works"""
    print("\n🧪 Testing authentication...")
    
    test_users = [
        ("developer@test.com", "password123"),
        ("lender@test.com", "password123"),
        ("admin@test.com", "password123")
    ]
    
    success_count = 0
    
    for email, password in test_users:
        try:
            response = requests.post(
                f"{API_URL}/api/v1/auth/login",
                json={"email": email, "password": password},
                timeout=5
            )
            
            if response.status_code == 200:
                print(f"✅ {email} - Login successful")
                success_count += 1
            else:
                print(f"❌ {email} - Login failed ({response.status_code})")
                
        except Exception as e:
            print(f"❌ {email} - Error: {e}")
    
    return success_count == len(test_users)

def main():
    """Main initialization process"""
    print("🚀 HomeVerse Production Database Initialization")
    print("=" * 50)
    
    # Step 1: Wait for deployment
    if not wait_for_deployment():
        print("❌ Deployment timeout - service not responding")
        return
    
    # Step 2: Initialize database
    if not initialize_database():
        print("❌ Database initialization failed")
        return
    
    # Step 3: Test authentication
    time.sleep(2)  # Give DB a moment to settle
    
    if test_authentication():
        print("\n🎉 SUCCESS! Production database is initialized and working!")
        print("\nTest credentials:")
        print("- developer@test.com / password123")
        print("- lender@test.com / password123")
        print("- buyer@test.com / password123")
        print("- applicant@test.com / password123")
        print("- admin@test.com / password123")
    else:
        print("\n⚠️ Database initialized but authentication not working")
        print("Check Render logs for details")

if __name__ == "__main__":
    main()