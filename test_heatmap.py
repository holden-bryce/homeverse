#!/usr/bin/env python3
"""
Test script to check heatmap data flow
"""
import requests
import json

def test_heatmap_endpoint():
    """Test the heatmap endpoint with authentication"""
    # First, let's login as a test user
    login_url = "http://localhost:8000/api/v1/auth/login"
    login_data = {
        "email": "developer@test.com",
        "password": "password123"
    }
    
    try:
        # Login
        print("🔐 Logging in as developer@test.com...")
        login_response = requests.post(login_url, json=login_data, timeout=10)
        print(f"Login status: {login_response.status_code}")
        
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.text}")
            return
            
        login_result = login_response.json()
        access_token = login_result.get("access_token")
        
        if not access_token:
            print("No access token received")
            return
            
        print(f"✅ Login successful, token: {access_token[:20]}...")
        
        # Now test the heatmap endpoint
        heatmap_url = "http://localhost:8000/api/v1/analytics/heatmap"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        print("\n🗺️ Testing heatmap endpoint...")
        heatmap_response = requests.get(heatmap_url, headers=headers, timeout=10)
        print(f"Heatmap status: {heatmap_response.status_code}")
        
        if heatmap_response.status_code == 200:
            heatmap_data = heatmap_response.json()
            print(f"✅ Heatmap data received!")
            print(f"Projects: {len(heatmap_data.get('projects', []))}")
            print(f"Demand zones: {len(heatmap_data.get('demand_zones', []))}")
            print(f"Statistics: {heatmap_data.get('statistics', {})}")
            
            # Show sample project data
            if heatmap_data.get('projects'):
                sample_project = heatmap_data['projects'][0]
                print(f"\nSample project: {sample_project.get('name', 'Unknown')}")
                print(f"  Coordinates: {sample_project.get('lat')}, {sample_project.get('lng')}")
                print(f"  Units: {sample_project.get('units', 0)}")
                print(f"  Affordable units: {sample_project.get('affordable_units', 0)}")
                print(f"  Intensity: {sample_project.get('intensity', 0)}")
            
            # Show sample demand zone data
            if heatmap_data.get('demand_zones'):
                sample_zone = heatmap_data['demand_zones'][0]
                print(f"\nSample demand zone:")
                print(f"  Coordinates: {sample_zone.get('lat')}, {sample_zone.get('lng')}")
                print(f"  Applicant count: {sample_zone.get('applicant_count', 0)}")
                print(f"  Intensity: {sample_zone.get('intensity', 0)}")
                
            # Test with bounds parameter
            print("\n🌍 Testing with bounds parameter...")
            bounds = "37.7,-122.5,37.8,-122.3"  # SF area bounds
            bounded_response = requests.get(
                f"{heatmap_url}?bounds={bounds}&data_type=demand", 
                headers=headers, 
                timeout=10
            )
            print(f"Bounded query status: {bounded_response.status_code}")
            
            if bounded_response.status_code == 200:
                bounded_data = bounded_response.json()
                print(f"Bounded projects: {len(bounded_data.get('projects', []))}")
                print(f"Bounded demand zones: {len(bounded_data.get('demand_zones', []))}")
        else:
            print(f"❌ Heatmap request failed: {heatmap_response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_heatmap_endpoint()