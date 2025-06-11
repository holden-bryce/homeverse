#!/usr/bin/env python3
"""Redirect stub - runs supabase_backend.py instead"""
import subprocess
import sys
import os

print("=== REDIRECT: simple_backend.py -> supabase_backend.py ===")
print("This is a redirect stub. Running supabase_backend.py instead...")

# Change to the correct directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Run the supabase backend
try:
    subprocess.run([sys.executable, "supabase_backend.py"], check=True)
except FileNotFoundError:
    print("supabase_backend.py not found!")
    sys.exit(1)
except subprocess.CalledProcessError as e:
    print(f"Error running supabase_backend.py: {e}")
    sys.exit(1)