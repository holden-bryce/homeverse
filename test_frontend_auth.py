#!/usr/bin/env python3
"""
Test authentication flow between frontend (Supabase) and backend
"""
import requests
import json

def test_supabase_auth_flow():
    """Test the full authentication flow"""
    
    # 1. First login through Supabase-compatible endpoint
    print("🔐 Testing Supabase auth flow...")
    
    # The supabase_backend.py should have a Supabase-compatible login endpoint
    login_url = "http://localhost:8000/api/v1/auth/signin"  # Supabase format
    login_data = {
        "email": "developer@test.com",
        "password": "password123"
    }
    
    try:
        # Try Supabase-style login
        print("Trying Supabase-style login...")
        login_response = requests.post(login_url, json=login_data, timeout=10)
        print(f"Supabase login status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            access_token = login_result.get("access_token") or login_result.get("session", {}).get("access_token")
            
            if access_token:
                print(f"✅ Got Supabase token: {access_token[:20]}...")
                
                # Test the heatmap endpoint with this token
                print("\n🗺️ Testing heatmap with Supabase token...")
                heatmap_url = "http://localhost:8000/api/v1/analytics/heatmap"
                headers = {"Authorization": f"Bearer {access_token}"}
                
                heatmap_response = requests.get(heatmap_url, headers=headers, timeout=10)
                print(f"Heatmap status with Supabase token: {heatmap_response.status_code}")
                
                if heatmap_response.status_code == 200:
                    data = heatmap_response.json()
                    print(f"✅ Heatmap works! Projects: {len(data.get('projects', []))}, Zones: {len(data.get('demand_zones', []))}")
                    return True
                else:
                    print(f"❌ Heatmap failed: {heatmap_response.text[:200]}")
            else:
                print("❌ No access token in Supabase response")
        else:
            print(f"Supabase login failed: {login_response.text}")
            
    except Exception as e:
        print(f"Error in Supabase flow: {e}")
    
    # 2. If Supabase flow fails, try the original login endpoint
    print("\n🔐 Testing original auth flow...")
    original_login_url = "http://localhost:8000/api/v1/auth/login"
    
    try:
        login_response = requests.post(original_login_url, json=login_data, timeout=10)
        print(f"Original login status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            access_token = login_result.get("access_token")
            
            if access_token:
                print(f"✅ Got original token: {access_token[:20]}...")
                
                # Test the heatmap endpoint with this token
                print("\n🗺️ Testing heatmap with original token...")
                heatmap_url = "http://localhost:8000/api/v1/analytics/heatmap"
                headers = {"Authorization": f"Bearer {access_token}"}
                
                heatmap_response = requests.get(heatmap_url, headers=headers, timeout=10)
                print(f"Heatmap status with original token: {heatmap_response.status_code}")
                
                if heatmap_response.status_code == 200:
                    data = heatmap_response.json()
                    print(f"✅ Heatmap works! Projects: {len(data.get('projects', []))}, Zones: {len(data.get('demand_zones', []))}")
                    return True
                else:
                    print(f"❌ Heatmap failed: {heatmap_response.text[:200]}")
            else:
                print("❌ No access token in original response")
        else:
            print(f"Original login failed: {login_response.text}")
            
    except Exception as e:
        print(f"Error in original flow: {e}")
    
    return False

if __name__ == "__main__":
    success = test_supabase_auth_flow()
    if not success:
        print("\n❌ Both authentication flows failed")
        print("This suggests there's a mismatch between frontend and backend auth")