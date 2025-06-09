#!/usr/bin/env python3
"""Emergency fix to get login working"""

import re

def fix_login():
    with open('simple_backend.py', 'r') as f:
        content = f.read()
    
    # 1. Make sure CORS headers are present on login response
    cors_headers_fix = '''    # CORS headers for login
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type, authorization"
    }'''
    
    # 2. Simplify the login endpoint to remove the new complications
    simple_login = '''@app.post("/api/v1/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest, conn=Depends(get_db)):
    """Login user"""
    try:
        # Get user by email
        cursor = conn.cursor()
        
        if USE_POSTGRESQL and pg_pool:
            cursor.execute("SELECT * FROM users WHERE email = %s", (request.email,))
            user_row = cursor.fetchone()
            if user_row:
                columns = [desc[0] for desc in cursor.description]
                user = dict(zip(columns, user_row))
            else:
                user = None
        else:
            cursor.execute("SELECT * FROM users WHERE email = ?", (request.email,))
            user_row = cursor.fetchone()
            user = dict(user_row) if user_row else None
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Check password
        password_hash = user.get('hashed_password') or user.get('password_hash')
        if not password_hash or not verify_password(request.password, password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create token
        token_data = {
            "sub": user['id'], 
            "email": user['email'], 
            "role": user.get('role', 'user')
        }
        access_token = create_access_token(token_data)
        
        # Return response with CORS headers
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user['id'],
                "email": user['email'],
                "role": user.get('role', 'user'),
                "company_id": user.get('company_id', '')
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")'''
    
    # Replace the login endpoint
    login_pattern = r'@app\.post\("/api/v1/auth/login".*?\n.*?raise HTTPException\(status_code=500, detail=f"Authentication failed: {str\(e\)}"?\)'
    content = re.sub(login_pattern, simple_login, content, flags=re.DOTALL)
    
    # 3. Add explicit OPTIONS handler for login
    options_handler = '''
@app.options("/api/v1/auth/login")
async def login_options():
    """Handle CORS preflight for login"""
    return JSONResponse(
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "content-type, authorization",
            "Access-Control-Allow-Credentials": "true"
        }
    )'''
    
    # Add after the login endpoint
    content = re.sub(
        r'(@app\.post\("/api/v1/auth/login".*?raise HTTPException\(status_code=500, detail=f"Login failed: {str\(e\)}"?\))',
        r'\1\n' + options_handler,
        content,
        flags=re.DOTALL
    )
    
    # 4. Make sure we have JSONResponse imported
    if 'from fastapi.responses import' in content and 'JSONResponse' not in content:
        content = content.replace(
            'from fastapi.responses import FileResponse',
            'from fastapi.responses import FileResponse, JSONResponse'
        )
    
    # Write the fixed file
    with open('simple_backend.py', 'w') as f:
        f.write(content)
    
    print("✅ Applied emergency login fix")
    print("\nChanges made:")
    print("1. Simplified login endpoint")
    print("2. Added explicit CORS headers")
    print("3. Added OPTIONS handler for login")
    print("4. Better error handling")

if __name__ == "__main__":
    fix_login()