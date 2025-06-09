#!/usr/bin/env python3
"""Final test before deployment"""

import subprocess
import sys

def final_test():
    print("🔍 Final pre-deployment test...\n")
    
    # 1. Syntax check
    print("1. Syntax check...")
    result = subprocess.run([sys.executable, "-m", "py_compile", "simple_backend.py"], 
                          capture_output=True, text=True)
    if result.returncode != 0:
        print("❌ Syntax error:")
        print(result.stderr)
        return False
    print("✅ Syntax OK")
    
    # 2. Check for deployment killers
    print("\n2. Checking for deployment killers...")
    with open('simple_backend.py', 'r') as f:
        content = f.read()
    
    deployment_killers = [
        ('asyncpg', 'asyncpg import that caused the failure'),
        ('await init_postgresql', 'call to removed async function'),
        ('await create_test_users_pg', 'call to removed async function'),
    ]
    
    issues = []
    for pattern, description in deployment_killers:
        if pattern in content:
            issues.append(f"Found '{pattern}' - {description}")
    
    if issues:
        print("❌ Found deployment killers:")
        for issue in issues:
            print(f"  - {issue}")
        return False
    print("✅ No deployment killers found")
    
    # 3. Check startup/shutdown events
    print("\n3. Checking startup/shutdown...")
    startup_count = content.count('@app.on_event("startup")')
    shutdown_count = content.count('@app.on_event("shutdown")')
    
    if startup_count != 1:
        print(f"❌ Expected 1 startup event, found {startup_count}")
        return False
    
    if shutdown_count != 1:
        print(f"❌ Expected 1 shutdown event, found {shutdown_count}")
        return False
    
    print("✅ Startup/shutdown events OK")
    
    # 4. Check PostgreSQL pool
    print("\n4. Checking PostgreSQL pool...")
    if 'pg_pool = psycopg2.pool.SimpleConnectionPool' not in content:
        print("❌ PostgreSQL pool initialization not found")
        return False
    
    print("✅ PostgreSQL pool OK")
    
    print("\n✅ ALL TESTS PASSED! Ready for deployment.")
    return True

if __name__ == "__main__":
    if final_test():
        print("\n🚀 SAFE TO DEPLOY!")
        sys.exit(0)
    else:
        print("\n❌ NOT SAFE TO DEPLOY!")
        sys.exit(1)