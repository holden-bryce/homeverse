#!/usr/bin/env python3
"""Add registration, email verification, and password reset endpoints"""

import re

def add_registration_endpoints():
    """Add all registration-related endpoints"""
    
    with open('simple_backend.py', 'r') as f:
        content = f.read()
    
    # Find where to insert the new endpoints (after the existing register endpoint)
    # First, let's update the existing register endpoint
    new_register_endpoint = '''@app.post("/api/v1/auth/register")
@limiter.limit("3/hour")
async def register(request: Request, form_data: RegisterRequest, conn=Depends(get_db)):
    """Register new user with email verification"""
    try:
        # Validate email
        validation = validate_email(form_data.email)
        email = validation.email
    except EmailNotValidError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Validate password strength
    if len(form_data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not any(c.isdigit() for c in form_data.password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number")
    if not any(c.isalpha() for c in form_data.password):
        raise HTTPException(status_code=400, detail="Password must contain at least one letter")
    
    cursor = conn.cursor()
    
    # Check if user already exists
    if USE_POSTGRESQL and pg_pool:
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    else:
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate company key
    company_key = form_data.company_key or f"{form_data.company_name.lower().replace(' ', '-')}-{secrets.token_hex(4)}"
    
    # Get or create company
    company = get_or_create_company(conn, company_key)
    
    # Create user (but not verified)
    user_id = str(uuid.uuid4())
    password_hash = hash_password(form_data.password)
    
    if USE_POSTGRESQL and pg_pool:
        cursor.execute("""
            INSERT INTO users (id, company_id, email, password_hash, role, email_verified, active)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (user_id, company['id'], email, password_hash, form_data.role, False, True))
    else:
        cursor.execute("""
            INSERT INTO users (id, company_id, email, hashed_password, role, email_verified, active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_id, company['id'], email, password_hash, form_data.role, False, True))
    
    # Create verification token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=24)
    verification_id = str(uuid.uuid4())
    
    if USE_POSTGRESQL and pg_pool:
        cursor.execute("""
            INSERT INTO email_verifications (id, user_id, token, expires_at)
            VALUES (%s, %s, %s, %s)
        """, (verification_id, user_id, token, expires_at))
    else:
        cursor.execute("""
            INSERT INTO email_verifications (id, user_id, token, expires_at)
            VALUES (?, ?, ?, ?)
        """, (verification_id, user_id, token, expires_at))
    
    conn.commit()
    
    # Send verification email
    verification_url = f"https://homeverse-frontend.onrender.com/auth/verify?token={token}"
    send_verification_email(email, form_data.full_name or email, verification_url)
    
    logger.info(f"New user registered: {email}")
    
    return {
        "message": "Registration successful. Please check your email to verify your account.",
        "user_id": user_id
    }'''
    
    # Replace the existing register endpoint
    register_pattern = r'@app\.post\("/api/v1/auth/register"\)[\s\S]*?return {"message": "User created successfully", "user_id": user\[\'id\'\]}'
    content = re.sub(register_pattern, new_register_endpoint, content)
    
    # Add new endpoints after login endpoint
    new_endpoints = '''

@app.get("/api/v1/auth/verify-email")
async def verify_email(token: str, conn=Depends(get_db)):
    """Verify email with token"""
    cursor = conn.cursor()
    
    # Check token
    if USE_POSTGRESQL and pg_pool:
        cursor.execute("""
            SELECT ev.user_id, ev.expires_at, u.email
            FROM email_verifications ev
            JOIN users u ON ev.user_id = u.id
            WHERE ev.token = %s AND ev.verified_at IS NULL
        """, (token,))
    else:
        cursor.execute("""
            SELECT ev.user_id, ev.expires_at, u.email
            FROM email_verifications ev
            JOIN users u ON ev.user_id = u.id
            WHERE ev.token = ? AND ev.verified_at IS NULL
        """, (token,))
    
    result = cursor.fetchone()
    if not result:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    
    if USE_POSTGRESQL and pg_pool:
        user_id, expires_at, email = result
    else:
        user_id = result['user_id']
        expires_at = result['expires_at']
        email = result['email']
    
    # Check expiration
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    
    if expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification token has expired")
    
    # Update verification status
    if USE_POSTGRESQL and pg_pool:
        cursor.execute("""
            UPDATE email_verifications 
            SET verified_at = CURRENT_TIMESTAMP 
            WHERE token = %s
        """, (token,))
        
        cursor.execute("""
            UPDATE users 
            SET email_verified = TRUE 
            WHERE id = %s
        """, (user_id,))
    else:
        cursor.execute("""
            UPDATE email_verifications 
            SET verified_at = CURRENT_TIMESTAMP 
            WHERE token = ?
        """, (token,))
        
        cursor.execute("""
            UPDATE users 
            SET email_verified = 1
            WHERE id = ?
        """, (user_id,))
    
    conn.commit()
    
    logger.info(f"Email verified for user: {email}")
    
    return {"message": "Email verified successfully. You can now log in."}

@app.post("/api/v1/auth/resend-verification")
@limiter.limit("3/hour")
async def resend_verification(request: Request, email: EmailStr, conn=Depends(get_db)):
    """Resend verification email"""
    cursor = conn.cursor()
    
    # Get user
    if USE_POSTGRESQL and pg_pool:
        cursor.execute("""
            SELECT id, email_verified 
            FROM users 
            WHERE email = %s
        """, (email,))
    else:
        cursor.execute("""
            SELECT id, email_verified 
            FROM users 
            WHERE email = ?
        """, (email,))
    
    user = cursor.fetchone()
    if not user:
        # Don't reveal if email exists
        return {"message": "If the email exists, a new verification link has been sent."}
    
    if USE_POSTGRESQL and pg_pool:
        user_id, email_verified = user
    else:
        user_id = user['id']
        email_verified = user['email_verified']
    
    if email_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    
    # Create new verification token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=24)
    verification_id = str(uuid.uuid4())
    
    if USE_POSTGRESQL and pg_pool:
        cursor.execute("""
            INSERT INTO email_verifications (id, user_id, token, expires_at)
            VALUES (%s, %s, %s, %s)
        """, (verification_id, user_id, token, expires_at))
    else:
        cursor.execute("""
            INSERT INTO email_verifications (id, user_id, token, expires_at)
            VALUES (?, ?, ?, ?)
        """, (verification_id, user_id, token, expires_at))
    
    conn.commit()
    
    # Send verification email
    verification_url = f"https://homeverse-frontend.onrender.com/auth/verify?token={token}"
    send_verification_email(email, email, verification_url)
    
    return {"message": "Verification email sent. Please check your inbox."}

@app.post("/api/v1/auth/forgot-password")
@limiter.limit("3/hour")
async def forgot_password(request: Request, email: EmailStr, conn=Depends(get_db)):
    """Request password reset"""
    cursor = conn.cursor()
    
    # Check if user exists
    if USE_POSTGRESQL and pg_pool:
        cursor.execute("SELECT id, email FROM users WHERE email = %s", (email,))
    else:
        cursor.execute("SELECT id, email FROM users WHERE email = ?", (email,))
    
    user = cursor.fetchone()
    
    if user:
        if USE_POSTGRESQL and pg_pool:
            user_id = user[0]
            user_email = user[1]
        else:
            user_id = user['id']
            user_email = user['email']
        
        # Create reset token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=1)
        reset_id = str(uuid.uuid4())
        
        if USE_POSTGRESQL and pg_pool:
            cursor.execute("""
                INSERT INTO password_resets (id, user_id, token, expires_at)
                VALUES (%s, %s, %s, %s)
            """, (reset_id, user_id, token, expires_at))
        else:
            cursor.execute("""
                INSERT INTO password_resets (id, user_id, token, expires_at)
                VALUES (?, ?, ?, ?)
            """, (reset_id, user_id, token, expires_at))
        
        conn.commit()
        
        # Send reset email
        reset_url = f"https://homeverse-frontend.onrender.com/auth/reset-password?token={token}"
        send_password_reset_email(user_email, user_email, reset_url)
        
        logger.info(f"Password reset requested for: {email}")
    
    # Always return success to prevent email enumeration
    return {"message": "If the email exists, a password reset link has been sent."}

@app.post("/api/v1/auth/reset-password")
async def reset_password(token: str = Form(...), password: str = Form(...), conn=Depends(get_db)):
    """Reset password with token"""
    # Validate password strength
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not any(c.isdigit() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number")
    
    cursor = conn.cursor()
    
    # Validate token
    if USE_POSTGRESQL and pg_pool:
        cursor.execute("""
            SELECT pr.user_id, pr.expires_at
            FROM password_resets pr
            WHERE pr.token = %s AND pr.used_at IS NULL
        """, (token,))
    else:
        cursor.execute("""
            SELECT pr.user_id, pr.expires_at
            FROM password_resets pr
            WHERE pr.token = ? AND pr.used_at IS NULL
        """, (token,))
    
    result = cursor.fetchone()
    if not result:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    if USE_POSTGRESQL and pg_pool:
        user_id, expires_at = result
    else:
        user_id = result['user_id']
        expires_at = result['expires_at']
    
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    
    if expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Update password
    password_hash = hash_password(password)
    
    if USE_POSTGRESQL and pg_pool:
        cursor.execute("""
            UPDATE users SET password_hash = %s WHERE id = %s
        """, (password_hash, user_id))
        
        # Mark token as used
        cursor.execute("""
            UPDATE password_resets SET used_at = CURRENT_TIMESTAMP WHERE token = %s
        """, (token,))
    else:
        cursor.execute("""
            UPDATE users SET hashed_password = ? WHERE id = ?
        """, (password_hash, user_id))
        
        cursor.execute("""
            UPDATE password_resets SET used_at = CURRENT_TIMESTAMP WHERE token = ?
        """, (token,))
    
    conn.commit()
    
    logger.info(f"Password reset successfully for user: {user_id}")
    
    return {"message": "Password reset successfully. You can now log in with your new password."}'''
    
    # Find the login endpoint and add new endpoints after it
    login_pattern = r'(@app\.post\("/api/v1/auth/login".*?\n    \))'
    
    # First, let's also update the login endpoint to check email verification
    updated_login = '''@app.post("/api/v1/auth/login", response_model=LoginResponse)
@limiter.limit("5/minute")
async def login(request: Request, login_data: LoginRequest, conn=Depends(get_db)):
    """Login user"""
    logger.info(f"Login attempt for: {login_data.email}")
    
    try:
        # Debug: Check if we're using PostgreSQL
        logger.info(f"USE_POSTGRESQL: {USE_POSTGRESQL}")
        logger.info(f"pg_pool exists: {pg_pool is not None}")
        
        user = verify_user_credentials(conn, login_data.email, login_data.password)
        if not user:
            logger.warning(f"Failed login attempt for email: {login_data.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Check if email is verified
        email_verified = user.get('email_verified', True)  # Default to True for existing users
        if not email_verified:
            raise HTTPException(status_code=403, detail="Please verify your email before logging in")
            
        logger.info(f"User authenticated successfully: {user.get('email')}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error for {login_data.email}: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")'''
    
    # Find and replace the login endpoint
    login_endpoint_pattern = r'@app\.post\("/api/v1/auth/login".*?\)[\s\S]*?raise HTTPException\(status_code=500, detail=f"Authentication failed: {str\(e\)}"?\)'
    content = re.sub(login_endpoint_pattern, updated_login, content, count=1)
    
    # Now add the new endpoints after the login endpoint
    content = re.sub(login_pattern, r'\1' + new_endpoints, content, flags=re.DOTALL)
    
    # Update RegisterRequest model to include full_name
    register_request_update = '''class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    company_key: Optional[str] = None
    company_name: Optional[str] = "Default Company"
    role: str = "user"
    full_name: Optional[str] = None'''
    
    register_request_pattern = r'class RegisterRequest\(BaseModel\):[\s\S]*?role: str = "user"'
    content = re.sub(register_request_pattern, register_request_update, content)
    
    # Add Request import
    if 'from fastapi import FastAPI' in content and ', Request' not in content:
        content = content.replace(
            'from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, WebSocket, WebSocketDisconnect, Body',
            'from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, WebSocket, WebSocketDisconnect, Body, Request'
        )
    
    # Write the updated file
    with open('simple_backend.py', 'w') as f:
        f.write(content)
    
    print("✅ Added all registration endpoints")
    print("\nEndpoints added:")
    print("- POST /api/v1/auth/register (with email verification)")
    print("- GET /api/v1/auth/verify-email")
    print("- POST /api/v1/auth/resend-verification")
    print("- POST /api/v1/auth/forgot-password")
    print("- POST /api/v1/auth/reset-password")
    print("\nAlso updated:")
    print("- Login endpoint now checks email_verified status")
    print("- Added rate limiting to sensitive endpoints")

if __name__ == "__main__":
    add_registration_endpoints()