#!/usr/bin/env python3
"""Add debug logging to see the actual error"""

def add_debug():
    with open('simple_backend.py', 'r') as f:
        content = f.read()
    
    # Find the login endpoint and add debug logging
    debug_login = '''@app.post("/api/v1/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest, conn=Depends(get_db)):
    """Login user"""
    logger.info(f"Login attempt for: {request.email}")
    
    try:
        # Debug: Check if we're using PostgreSQL
        logger.info(f"USE_POSTGRESQL: {USE_POSTGRESQL}")
        logger.info(f"pg_pool exists: {pg_pool is not None}")
        
        user = verify_user_credentials(conn, request.email, request.password)
        if not user:
            logger.warning(f"Failed login attempt for email: {request.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        logger.info(f"User authenticated successfully: {user.get('email')}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error for {request.email}: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")'''
    
    # Replace the login function
    import re
    pattern = r'@app\.post\("/api/v1/auth/login".*?\n.*?\n.*?"""Login user""".*?raise HTTPException\(status_code=500, detail="Authentication service temporarily unavailable"\)'
    content = re.sub(pattern, debug_login, content, flags=re.DOTALL)
    
    with open('simple_backend.py', 'w') as f:
        f.write(content)
    
    print("✅ Added debug logging to login endpoint")

if __name__ == "__main__":
    add_debug()