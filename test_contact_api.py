import requests
import json

# Test the contact form endpoint
url = "http://localhost:8000/api/v1/contact"

# Test data
contact_data = {
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test Subject",
    "message": "This is a test message"
}

# Print the request details
print("Testing contact endpoint...")
print(f"URL: {url}")
print(f"Data: {json.dumps(contact_data, indent=2)}")

try:
    # Send POST request with JSON
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, json=contact_data, headers=headers)
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Body: {response.text}")
    
    if response.status_code != 200:
        print("\nError Details:")
        print(response.json())
        
except Exception as e:
    print(f"\nError: {str(e)}")