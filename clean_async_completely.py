#!/usr/bin/env python3
"""Clean all async PostgreSQL code completely"""

import re

def clean_async_code():
    with open('simple_backend.py', 'r') as f:
        content = f.read()
    
    # Remove ALL function definitions that contain asyncpg patterns
    # This is aggressive but necessary
    
    # 1. Remove any function that uses asyncpg patterns
    functions_to_remove = [
        r'async def init_postgresql\(\):[\s\S]*?(?=\n\n|\ndef|\nclass|\n@|\nif __name__|$)',
        r'async def create_test_users_pg\(\):[\s\S]*?(?=\n\n|\ndef|\nclass|\n@|\nif __name__|$)',
        r'def get_pg_db\(\):[\s\S]*?(?=\n\n|\ndef|\nclass|\n@|\nif __name__|$)',
    ]
    
    for pattern in functions_to_remove:
        content = re.sub(pattern, '', content, flags=re.MULTILINE)
    
    # 2. Remove any lines that contain asyncpg
    lines = content.split('\n')
    cleaned_lines = []
    skip_until_dedent = False
    
    for i, line in enumerate(lines):
        # Skip any block that contains asyncpg patterns
        if any(pattern in line for pattern in ['asyncpg', 'pg_pool.acquire', 'async with pg_pool']):
            # Skip this line and potentially following indented lines
            if 'async def' in line or 'def' in line:
                skip_until_dedent = True
            continue
        
        # If we're skipping a function, continue until we reach the same or lesser indentation
        if skip_until_dedent:
            if line.strip() == '' or line.startswith('    '):
                continue
            else:
                skip_until_dedent = False
        
        # Clean await statements that are not in async functions
        if 'await ' in line and not any(async_word in line for async_word in ['async def', 'async with']):
            # Check if this is in an async function
            is_in_async_function = False
            for j in range(max(0, i-20), i):
                if 'async def' in lines[j]:
                    is_in_async_function = True
                    break
                elif 'def ' in lines[j] and 'async' not in lines[j]:
                    break
            
            if not is_in_async_function:
                # Remove await from this line
                line = re.sub(r'await\s+', '', line)
        
        cleaned_lines.append(line)
    
    content = '\n'.join(cleaned_lines)
    
    # 3. Remove import asyncpg
    content = re.sub(r'import asyncpg\n', '', content)
    content = re.sub(r'from asyncpg import.*\n', '', content)
    
    # 4. Fix any references to async pg functions
    content = re.sub(r'await init_postgresql\(\)', '', content)
    content = re.sub(r'await create_test_users_pg\(\)', '', content)
    
    # 5. Clean up double newlines
    content = re.sub(r'\n\n\n+', '\n\n', content)
    
    # Write the cleaned file
    with open('simple_backend.py', 'w') as f:
        f.write(content)
    
    print("✅ Completely cleaned async PostgreSQL code")

if __name__ == "__main__":
    clean_async_code()