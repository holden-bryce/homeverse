#!/usr/bin/env python3
"""Temporarily force SQLite to get login working"""

import re

def force_sqlite():
    with open('simple_backend.py', 'r') as f:
        content = f.read()
    
    # Find the database type detection and force SQLite
    old_detection = 'USE_POSTGRESQL = bool(DATABASE_URL and DATABASE_URL.startswith("postgresql"))'
    new_detection = 'USE_POSTGRESQL = False  # Temporarily forced to SQLite for debugging'
    
    content = content.replace(old_detection, new_detection)
    
    with open('simple_backend.py', 'w') as f:
        f.write(content)
    
    print("✅ Forced SQLite mode temporarily")
    print("This will use the local SQLite database with test users")

if __name__ == "__main__":
    force_sqlite()