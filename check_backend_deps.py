#!/usr/bin/env python3
"""Check if backend dependencies are properly configured for Supabase"""

import sys
import importlib

# Check if all required modules are importable
required_modules = [
    'fastapi',
    'uvicorn',
    'supabase',
    'python_dotenv',
    'pydantic',
    'python_jose',
    'passlib',
    'email_validator'
]

print("🔍 Checking backend dependencies...")

missing_modules = []
for module in required_modules:
    try:
        if module == 'python_dotenv':
            importlib.import_module('dotenv')
        elif module == 'python_jose':
            importlib.import_module('jose')
        else:
            importlib.import_module(module)
        print(f"✅ {module}")
    except ImportError:
        print(f"❌ {module}")
        missing_modules.append(module)

if missing_modules:
    print(f"\n❌ Missing modules: {', '.join(missing_modules)}")
    print("Run: pip install -r requirements_supabase.txt")
    sys.exit(1)
else:
    print("\n✅ All dependencies are available!")

# Check if supabase_backend.py is valid Python
print("\n🔍 Checking supabase_backend.py syntax...")
try:
    with open('supabase_backend.py', 'r') as f:
        code = f.read()
    compile(code, 'supabase_backend.py', 'exec')
    print("✅ supabase_backend.py syntax is valid")
except SyntaxError as e:
    print(f"❌ Syntax error in supabase_backend.py: {e}")
    sys.exit(1)
except FileNotFoundError:
    print("❌ supabase_backend.py not found")
    sys.exit(1)

print("\n🎉 Backend appears ready for deployment!")