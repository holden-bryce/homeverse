#!/usr/bin/env python3
"""Test script to verify Resend email integration"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    import resend
    print("✅ Resend package installed successfully")
except ImportError:
    print("❌ Resend package not installed. Please run: pip install resend")
    sys.exit(1)

# Get API key from environment
RESEND_API_KEY = os.getenv("RESEND_API_KEY")

if not RESEND_API_KEY:
    print("❌ RESEND_API_KEY not found in environment variables")
    sys.exit(1)

print(f"✅ RESEND_API_KEY found: {RESEND_API_KEY[:10]}...")

# Configure Resend
resend.api_key = RESEND_API_KEY

# Test sending an email
print("\n📧 Testing email send...")
try:
    response = resend.Emails.send({
        "from": "HomeVerse <noreply@homeverse.io>",
        "to": ["holdenbryce06@gmail.com"],
        "subject": "Test Email - Resend Integration",
        "html": """
        <h2>Resend Integration Test</h2>
        <p>This is a test email to verify that the Resend integration is working correctly.</p>
        <p>If you're seeing this, the integration was successful!</p>
        <p>Best regards,<br>HomeVerse Team</p>
        """
    })
    
    print(f"✅ Email sent successfully!")
    print(f"   Email ID: {response.get('id', 'N/A')}")
    
except Exception as e:
    print(f"❌ Error sending email: {e}")
    sys.exit(1)

print("\n🎉 Resend integration test completed successfully!")