#!/usr/bin/env python3
"""Comprehensive test before deployment"""

import subprocess
import sys
import re

def comprehensive_test():
    print("🔍 Comprehensive pre-deployment test...\n")
    
    # 1. Syntax check
    print("1. Checking syntax...")
    result = subprocess.run([sys.executable, "-m", "py_compile", "simple_backend.py"], 
                          capture_output=True, text=True)
    if result.returncode != 0:
        print("❌ Syntax error:")
        print(result.stderr)
        return False
    print("✅ Syntax OK\n")
    
    # 2. Check for problematic patterns
    print("2. Checking for problematic patterns...")
    with open('simple_backend.py', 'r') as f:
        content = f.read()
    
    issues = []
    
    # Check for asyncpg
    if 'asyncpg' in content:
        issues.append("Found 'asyncpg' reference")
    
    # Check for await without async function
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'await ' in line and 'async def' not in lines[max(0, i-10):i]:
            # Make sure it's not in a comment
            if not line.strip().startswith('#'):
                issues.append(f"Line {i+1}: 'await' outside async function: {line.strip()}")
    
    # Check for pg_pool.acquire (asyncpg pattern)
    if 'pg_pool.acquire' in content:
        issues.append("Found 'pg_pool.acquire' (asyncpg pattern)")
    
    # Check for async with pg_pool
    if 'async with pg_pool' in content:
        issues.append("Found 'async with pg_pool' (asyncpg pattern)")
    
    # Check for unmatched parentheses/quotes in key areas
    pg_pool_definitions = re.findall(r'pg_pool = .*', content)
    print(f"Found pg_pool definitions: {len(pg_pool_definitions)}")
    
    if issues:
        print("❌ Found issues:")
        for issue in issues:
            print(f"  - {issue}")
        return False
    print("✅ No problematic patterns\n")
    
    # 3. Check imports
    print("3. Checking required imports...")
    required_imports = [
        'psycopg2',
        'fastapi',
        'uvicorn'
    ]
    
    missing_imports = []
    for imp in required_imports:
        if f'import {imp}' not in content and f'from {imp}' not in content:
            missing_imports.append(imp)
    
    if missing_imports:
        print("❌ Missing imports:")
        for imp in missing_imports:
            print(f"  - {imp}")
        return False
    print("✅ All required imports present\n")
    
    # 4. Check for duplicate function definitions
    print("4. Checking for duplicate functions...")
    func_pattern = r'^(async )?def (\w+)\('
    functions = {}
    for i, line in enumerate(lines):
        match = re.match(func_pattern, line.strip())
        if match:
            func_name = match.group(2)
            if func_name in functions:
                print(f"❌ Duplicate function '{func_name}' at lines {functions[func_name]} and {i+1}")
                return False
            functions[func_name] = i+1
    print("✅ No duplicate functions\n")
    
    # 5. Check startup/shutdown events
    print("5. Checking startup/shutdown events...")
    startup_events = content.count('@app.on_event("startup")')
    shutdown_events = content.count('@app.on_event("shutdown")')
    
    if startup_events != 1:
        print(f"❌ Expected 1 startup event, found {startup_events}")
        return False
    
    if shutdown_events != 1:
        print(f"❌ Expected 1 shutdown event, found {shutdown_events}")
        return False
    
    print("✅ Startup/shutdown events OK\n")
    
    return True

if __name__ == "__main__":
    if comprehensive_test():
        print("✅ ALL TESTS PASSED! Safe to deploy.")
    else:
        print("❌ TESTS FAILED! Fix issues before deploying.")
        sys.exit(1)