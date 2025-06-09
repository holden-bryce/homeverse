#!/usr/bin/env python3
"""Remove remaining async functions"""

import re

def remove_async_functions():
    with open('simple_backend.py', 'r') as f:
        content = f.read()
    
    # Remove async create_test_users_pg function
    async_users_pattern = r'async def create_test_users_pg\(\):[\s\S]*?except Exception as e:[\s\S]*?logger\.error\(f"❌ Failed to create test users: {e}"\)'
    content = re.sub(async_users_pattern, '', content)
    
    # Remove any remaining async/await patterns that might be left
    content = re.sub(r'await create_test_users_pg\(\)', '', content)
    
    # Write the cleaned file
    with open('simple_backend.py', 'w') as f:
        f.write(content)
    
    print("✅ Removed remaining async functions")

if __name__ == "__main__":
    remove_async_functions()