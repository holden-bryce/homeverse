#!/usr/bin/env python3
"""
Test direct Supabase token validation
"""
import os
from supabase import create_client, Client

# Load environment variables
SUPABASE_URL = "https://vzxadsifonqklotzhdpl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eGFkc2lmb25xa2xvdHpoZHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MDQ0NTAsImV4cCI6MjA2NTA4MDQ1MH0.ZY31NHg6qamLBVeHT5Lo-ud0K_ayPh8DRamK5AUJ6t4"

def test_supabase_auth():
    """Test Supabase authentication and token validation"""
    
    try:
        # Create Supabase client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase client created")
        
        # Try to sign in
        print("🔐 Signing in with developer@test.com...")
        result = supabase.auth.sign_in_with_password({
            "email": "developer@test.com",
            "password": "password123"
        })
        
        if result.session:
            access_token = result.session.access_token
            print(f"✅ Got Supabase access token: {access_token[:20]}...")
            
            # Test token validation (what the backend does)
            print("🔍 Testing token validation...")
            user_response = supabase.auth.get_user(access_token)
            
            if user_response.user:
                print(f"✅ Token valid! User: {user_response.user.email}")
                
                # Now test with the backend
                import requests
                heatmap_url = "http://localhost:8000/api/v1/analytics/heatmap"
                headers = {"Authorization": f"Bearer {access_token}"}
                
                print("🗺️ Testing backend with Supabase token...")
                response = requests.get(heatmap_url, headers=headers, timeout=10)
                print(f"Backend response: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Backend accepts Supabase token! Projects: {len(data.get('projects', []))}")
                else:
                    print(f"❌ Backend rejected token: {response.text[:200]}")
                    
            else:
                print("❌ Token invalid")
        else:
            print(f"❌ Login failed: {result}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_supabase_auth()