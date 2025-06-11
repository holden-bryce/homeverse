#!/usr/bin/env python3
"""Main entry point - redirects to supabase_backend.py"""
import subprocess
import sys

print("=== HomeVerse Main Entry Point ===")
print("Redirecting to supabase_backend.py...")

# Run the supabase backend
subprocess.run([sys.executable, "supabase_backend.py"])