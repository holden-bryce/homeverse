#!/usr/bin/env python3
"""Fix build error by removing conflicting asyncpg code"""

import re

def fix_build():
    with open('simple_backend.py', 'r') as f:
        content = f.read()
    
    # 1. Remove the duplicate pg_pool declaration and async init_postgresql function
    # This is causing the conflict
    remove_async_init = r'# Global PostgreSQL connection pool\npg_pool = None\n\nasync def init_postgresql\(\):[\s\S]*?return pg_pool'
    content = re.sub(remove_async_init, '', content)
    
    # 2. Remove duplicate CORS middleware (if any)
    # Count occurrences of CORS middleware
    cors_pattern = r'app\.add_middleware\(\s*CORSMiddleware,'
    cors_matches = re.findall(cors_pattern, content)
    if len(cors_matches) > 1:
        # Keep only the first one
        positions = [m.start() for m in re.finditer(cors_pattern, content)]
        if len(positions) > 1:
            # Find the second occurrence and remove it
            second_cors = content.find('app.add_middleware(\n    CORSMiddleware,', positions[1])
            if second_cors != -1:
                # Find the end of this middleware block
                end_pos = content.find(')', second_cors)
                # Count parentheses to find the correct closing
                paren_count = 1
                i = second_cors + len('app.add_middleware(')
                while i < len(content) and paren_count > 0:
                    if content[i] == '(':
                        paren_count += 1
                    elif content[i] == ')':
                        paren_count -= 1
                    i += 1
                # Remove the duplicate
                content = content[:second_cors] + content[i:]
    
    # 3. Remove duplicate rate limiter initialization
    limiter_pattern = r'# Initialize rate limiter\nlimiter = Limiter.*?\n.*?\n.*?\n'
    limiter_matches = list(re.finditer(limiter_pattern, content))
    if len(limiter_matches) > 1:
        # Remove all but the first
        for match in reversed(limiter_matches[1:]):
            content = content[:match.start()] + content[match.end():]
    
    # 4. Remove any asyncpg imports if they exist
    content = re.sub(r'import asyncpg\n', '', content)
    content = re.sub(r'from asyncpg import .*\n', '', content)
    
    # 5. Make sure psycopg2 is imported properly (only once)
    if content.count('import psycopg2') > 1:
        # Remove duplicate imports
        first_import = content.find('import psycopg2')
        content = content[:first_import] + content[first_import:].replace('import psycopg2\n', '', 1)
    
    # Write the fixed file
    with open('simple_backend.py', 'w') as f:
        f.write(content)
    
    print("✅ Fixed build errors")
    print("\nChanges made:")
    print("1. Removed conflicting asyncpg initialization")
    print("2. Removed duplicate CORS middleware")
    print("3. Removed duplicate rate limiter")
    print("4. Cleaned up imports")

if __name__ == "__main__":
    fix_build()