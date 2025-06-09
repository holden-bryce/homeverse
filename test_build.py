#!/usr/bin/env python3
"""Test build before deploying"""
import subprocess
import sys

def test_build():
    print("🔍 Testing build locally...\n")
    
    # 1. Check Python syntax
    print("1. Checking Python syntax...")
    result = subprocess.run([sys.executable, "-m", "py_compile", "simple_backend.py"], 
                          capture_output=True, text=True)
    if result.returncode != 0:
        print("❌ Syntax error found:")
        print(result.stderr)
        return False
    print("✅ No syntax errors\n")
    
    # 2. Check imports
    print("2. Checking imports...")
    try:
        # Create a test script that imports the backend
        test_import = '''
import sys
sys.path.insert(0, '.')
try:
    import simple_backend
    print("✅ All imports successful")
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
'''
        with open('test_import.py', 'w') as f:
            f.write(test_import)
        
        result = subprocess.run([sys.executable, "test_import.py"], 
                              capture_output=True, text=True)
        print(result.stdout)
        if result.returncode != 0:
            print(result.stderr)
            return False
    finally:
        # Clean up
        import os
        if os.path.exists('test_import.py'):
            os.remove('test_import.py')
    
    # 3. Check for common issues
    print("\n3. Checking for common issues...")
    with open('simple_backend.py', 'r') as f:
        content = f.read()
        lines = content.split('\n')
    
    issues = []
    
    # Check for duplicate imports
    import_lines = [line for line in lines if line.strip().startswith('import ') or line.strip().startswith('from ')]
    seen_imports = set()
    for line in import_lines:
        if line in seen_imports:
            issues.append(f"Duplicate import: {line.strip()}")
        seen_imports.add(line)
    
    # Check for undefined pg_pool
    if 'pg_pool' in content:
        # Make sure pg_pool is defined before use
        first_use = content.find('pg_pool')
        definition = content.find('pg_pool =')
        if definition == -1 or definition > first_use:
            issues.append("pg_pool used before definition")
    
    # Check for asyncpg references (should be removed)
    if 'asyncpg' in content:
        issues.append("Found asyncpg reference (should use psycopg2)")
    
    if issues:
        print("❌ Found issues:")
        for issue in issues:
            print(f"  - {issue}")
        return False
    else:
        print("✅ No common issues found\n")
    
    # 4. Check requirements
    print("4. Checking if all required packages are in requirements.txt...")
    required_packages = [
        'fastapi',
        'uvicorn',
        'psycopg2-binary',
        'pyjwt',
        'python-multipart',
        'slowapi',
        'email-validator'
    ]
    
    with open('requirements.txt', 'r') as f:
        requirements = f.read().lower()
    
    missing = []
    for pkg in required_packages:
        if pkg.lower() not in requirements:
            missing.append(pkg)
    
    if missing:
        print("❌ Missing from requirements.txt:")
        for pkg in missing:
            print(f"  - {pkg}")
    else:
        print("✅ All required packages in requirements.txt\n")
    
    return True

if __name__ == "__main__":
    if test_build():
        print("\n✅ Build test passed! Safe to deploy.")
    else:
        print("\n❌ Build test failed! Fix issues before deploying.")
        sys.exit(1)