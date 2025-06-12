#!/usr/bin/env python3
"""
Test the server-first migration functionality
"""
import requests
import time

BASE_URL = "http://localhost:3001"

def test_pages():
    """Test that pages are accessible"""
    print("🔍 Testing Page Access...")
    
    pages = [
        "/",
        "/auth/login",
        "/about",
        "/contact",
    ]
    
    for page in pages:
        try:
            response = requests.get(f"{BASE_URL}{page}", allow_redirects=False)
            print(f"✅ {page}: {response.status_code}")
        except Exception as e:
            print(f"❌ {page}: {str(e)}")
    
def test_api_health():
    """Test backend API"""
    print("\n🔍 Testing Backend API...")
    
    try:
        # Test the Supabase backend
        response = requests.get("http://localhost:8000/health")
        if response.status_code == 200:
            print(f"✅ Backend API: {response.json()}")
        else:
            print(f"❌ Backend API: {response.status_code}")
    except Exception as e:
        print(f"❌ Backend API Error: {str(e)}")

def check_logs():
    """Check for errors in logs"""
    print("\n📋 Checking Server Logs...")
    
    try:
        with open('/tmp/frontend_server.log', 'r') as f:
            lines = f.readlines()[-20:]  # Last 20 lines
            
        errors = [line for line in lines if 'error' in line.lower() or 'failed' in line.lower()]
        warnings = [line for line in lines if 'warning' in line.lower() or 'warn' in line.lower()]
        
        if errors:
            print(f"❌ Found {len(errors)} errors:")
            for error in errors:
                print(f"   {error.strip()}")
        else:
            print("✅ No errors found in logs")
            
        if warnings:
            print(f"⚠️  Found {len(warnings)} warnings")
    except Exception as e:
        print(f"❌ Could not read logs: {str(e)}")

if __name__ == "__main__":
    print("🚀 Testing Server-First Migration")
    print("================================\n")
    
    # Wait for server to fully start
    time.sleep(5)
    
    test_pages()
    test_api_health()
    check_logs()
    
    print("\n✅ Basic tests complete!")
    print("\nNext steps:")
    print("1. Open http://localhost:3001 in browser")
    print("2. Try logging in with admin@test.com / password123")
    print("3. Test creating an applicant")
    print("4. Check real-time updates")