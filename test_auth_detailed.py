#!/usr/bin/env python3
"""Test authentication with detailed error reporting"""
import requests
import json

def test_auth():
    """Test authentication endpoint"""
    url = "https://homeverse-api.onrender.com/api/v1/auth/login"
    
    # Test data
    payload = {
        "email": "developer@test.com",
        "password": "password123"
    }
    
    headers = {
        "Content-Type": "application/json",
        "Origin": "https://homeverse-frontend.onrender.com"
    }
    
    print("🧪 Testing authentication...")
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("\n✅ Authentication successful!")
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Check if we got a token
            if 'access_token' in data:
                print(f"\n🎉 Token received: {data['access_token'][:50]}...")
            else:
                print("\n⚠️  No access_token in response")
        else:
            print(f"\n❌ Authentication failed")
            try:
                error = response.json()
                print(f"Error: {json.dumps(error, indent=2)}")
            except:
                print(f"Raw response: {response.text}")
                
    except Exception as e:
        print(f"\n❌ Request failed: {e}")

if __name__ == "__main__":
    test_auth()