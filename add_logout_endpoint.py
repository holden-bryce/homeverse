#!/usr/bin/env python3
"""Add logout endpoint to simple_backend.py"""

# Read the current file
with open('simple_backend.py', 'r') as f:
    lines = f.readlines()

# Find where to insert the logout endpoint (after login endpoint)
insert_index = None
for i, line in enumerate(lines):
    if '@app.post("/api/v1/auth/login"' in line:
        # Find the end of this endpoint
        brace_count = 0
        for j in range(i, len(lines)):
            if '{' in lines[j]:
                brace_count += lines[j].count('{')
            if '}' in lines[j]:
                brace_count -= lines[j].count('}')
            # Look for the next @app decorator or end of function
            if j > i and brace_count == 0 and (lines[j].startswith('@app.') or lines[j].strip() == ''):
                insert_index = j
                break

if insert_index is None:
    print("Could not find where to insert logout endpoint")
    exit(1)

# Create the logout endpoint code
logout_endpoint = '''
@app.post("/api/v1/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user - invalidates token on client side"""
    # Since we're using stateless JWT, we just return success
    # The client should remove the token from storage
    logger.info(f"User {current_user.get('email')} logged out")
    
    return {
        "message": "Logout successful",
        "status": "success"
    }

@app.get("/api/v1/auth/logout")
async def logout_get(current_user: dict = Depends(get_current_user)):
    """Logout user via GET - for convenience"""
    logger.info(f"User {current_user.get('email')} logged out via GET")
    
    return {
        "message": "Logout successful",
        "status": "success"
    }

'''

# Insert the logout endpoint
lines.insert(insert_index, logout_endpoint)

# Write back to file
with open('simple_backend.py', 'w') as f:
    f.writelines(lines)

print(f"Added logout endpoints at line {insert_index}")
print("Logout endpoints added successfully!")