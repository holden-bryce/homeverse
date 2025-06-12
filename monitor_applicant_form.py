#!/usr/bin/env python3
"""
Monitor what happens when using the applicant form
"""

import time

print("🔍 MONITORING APPLICANT FORM")
print("=" * 50)
print("\n📋 INSTRUCTIONS FOR TESTING:")
print("\n1. You're already at: http://localhost:3000/dashboard/applicants/new")
print("\n2. Open Browser DevTools (F12)")
print("\n3. Go to Console tab")
print("\n4. Look for these messages:")
print("   - 'Current profile in NewApplicantPage:'")
print("   - 'Auth loading state:'")
print("   - Any errors about profile or company_id")
print("\n5. Try filling out the form:")
print("   - First Name: Test")
print("   - Last Name: User")
print("   - Email: test@example.com")
print("   - Phone: 555-0123")
print("   - Household Size: 3")
print("   - Income: 45000")
print("\n6. Click 'Save Applicant'")
print("\n7. Watch console for:")
print("   - 'useCreateApplicant - Initial profile check:'")
print("   - Any RLS errors")
print("   - Success or failure messages")
print("\n" + "=" * 50)
print("\n💡 EXPECTED ISSUES:")
print("- Profile loading timeout (same as login issue)")
print("- Missing company_id")
print("- RLS policies blocking insert")
print("\n🔧 IF IT FAILS:")
print("We'll need to create an emergency version of the applicant form")
print("that bypasses profile loading, similar to what we did for login.")

# Monitor the frontend log
try:
    print("\n📊 MONITORING FRONTEND LOG...")
    with open('/tmp/frontend.log', 'r') as f:
        # Go to end of file
        f.seek(0, 2)
        
        while True:
            line = f.readline()
            if line:
                line = line.strip()
                # Filter for relevant messages
                if any(keyword in line for keyword in ['applicant', 'profile', 'error', 'Emergency', 'POST', 'GET']):
                    print(f"[LOG] {line}")
            else:
                time.sleep(0.1)
                
except KeyboardInterrupt:
    print("\n\nMonitoring stopped.")
except Exception as e:
    print(f"\nError: {e}")