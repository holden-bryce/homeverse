#!/usr/bin/env python3
"""Quick patch for PostgreSQL authentication issue"""

# Read the file
with open('simple_backend.py', 'r') as f:
    content = f.read()

print("🔧 Applying quick PostgreSQL authentication fix...")

# Fix 1: Comment out the log_activity call in login function
# This is the quickest fix - just disable activity logging temporarily
old_login_log = """    # Log login activity
    log_activity(
        conn, 
        user['id'], 
        user['company_id'],
        "auth",
        "User Login",
        f"{user['email']} logged in successfully",
        status="success"
    )"""

new_login_log = """    # Log login activity - TEMPORARILY DISABLED FOR POSTGRESQL COMPATIBILITY
    # log_activity(
    #     conn, 
    #     user['id'], 
    #     user['company_id'],
    #     "auth",
    #     "User Login",
    #     f"{user['email']} logged in successfully",
    #     status="success"
    # )"""

if old_login_log in content:
    content = content.replace(old_login_log, new_login_log)
    print("✅ Disabled log_activity in login function")
else:
    print("❌ Could not find log_activity call in login function")

# Fix 2: Also fix the log_activity function to use proper placeholders
old_log_activity = """    cursor.execute(\"\"\"
        INSERT INTO activity_logs (
            id, company_id, user_id, type, title, description, 
            entity_type, entity_id, metadata, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    \"\"\", ("""

new_log_activity = """    if USE_POSTGRESQL and pg_pool:
        cursor.execute(\"\"\"
            INSERT INTO activity_logs (
                id, company_id, user_id, type, title, description, 
                entity_type, entity_id, metadata, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        \"\"\", (
            activity_id, company_id, user_id, activity_type, title, description,
            entity_type, entity_id, json.dumps(metadata) if metadata else None, status
        ))
    else:
        cursor.execute(\"\"\"
            INSERT INTO activity_logs (
                id, company_id, user_id, type, title, description, 
                entity_type, entity_id, metadata, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        \"\"\", ("""

if old_log_activity in content:
    # Find the complete statement and replace it
    import re
    pattern = r'cursor\.execute\(\"\"\"\s*INSERT INTO activity_logs.*?\)\)', 
    replacement = new_log_activity + "\n            activity_id, company_id, user_id, activity_type, title, description,\n            entity_type, entity_id, json.dumps(metadata) if metadata else None, status\n        ))"
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    print("✅ Fixed log_activity placeholders for PostgreSQL")

# Write the patched file
with open('simple_backend.py', 'w') as f:
    f.write(content)

print("\n✅ Quick patch applied!")
print("\nThis patch:")
print("1. Temporarily disables activity logging in the login function")
print("2. Fixes the log_activity function to use PostgreSQL placeholders")
print("\n🚀 Deploy with:")
print("git add simple_backend.py")
print("git commit -m 'fix: Temporarily disable activity logging to fix PostgreSQL auth'")
print("git push origin main")