#!/usr/bin/env python3
"""Add user registration with email verification to simple_backend.py"""

import re

def add_registration_features():
    """Add registration and email verification to the backend"""
    
    # Read current backend
    with open('simple_backend.py', 'r') as f:
        content = f.read()
    
    # Find imports section and add new imports
    imports_addition = """import secrets
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from email_validator import validate_email, EmailNotValidError
"""
    
    # Add after other imports
    import_pattern = r'(import traceback\nimport math)'
    content = re.sub(import_pattern, r'\1\n' + imports_addition, content)
    
    # Add rate limiter initialization after app creation
    limiter_code = """
# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
"""
    
    # Add after CORS middleware
    cors_pattern = r'(app\.add_middleware\(\s*CORSMiddleware,.*?\))'
    content = re.sub(cors_pattern, r'\1\n' + limiter_code, content, flags=re.DOTALL)
    
    # Add email verification table creation
    table_creation = """
    # Email verification tokens table
    cursor.execute(\"\"\"
        CREATE TABLE IF NOT EXISTS email_verifications (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            verified_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    \"\"\")
    
    # Password reset tokens table
    cursor.execute(\"\"\"
        CREATE TABLE IF NOT EXISTS password_resets (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            used_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    \"\"\")
"""
    
    # Add tables after activity_logs table creation
    activity_logs_pattern = r'(cursor\.execute\("""[\s\S]*?CREATE TABLE IF NOT EXISTS activity_logs[\s\S]*?"""\))'
    content = re.sub(activity_logs_pattern, r'\1\n' + table_creation, content)
    
    # Add email_verified column to users table
    email_verified_addition = """
    # Add email_verified column if it doesn't exist
    try:
        if USE_POSTGRESQL and pg_pool:
            cursor.execute("ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE")
        else:
            # SQLite doesn't support ALTER TABLE ADD COLUMN with constraints
            cursor.execute("PRAGMA table_info(users)")
            columns = [column[1] for column in cursor.fetchall()]
            if 'email_verified' not in columns:
                # Create new table with email_verified column
                cursor.execute(\"\"\"
                    CREATE TABLE users_new (
                        id TEXT PRIMARY KEY,
                        company_id TEXT,
                        email TEXT UNIQUE NOT NULL,
                        password_hash TEXT,
                        hashed_password TEXT,
                        role TEXT DEFAULT 'user',
                        active BOOLEAN DEFAULT true,
                        email_verified BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                \"\"\")
                cursor.execute("INSERT INTO users_new SELECT *, FALSE FROM users")
                cursor.execute("DROP TABLE users")
                cursor.execute("ALTER TABLE users_new RENAME TO users")
    except:
        pass  # Column might already exist
"""
    
    # Add after users table creation
    users_table_pattern = r'(cursor\.execute\("""[\s\S]*?CREATE TABLE IF NOT EXISTS users[\s\S]*?"""\))'
    content = re.sub(users_table_pattern, r'\1\n' + email_verified_addition, content)
    
    # Add email sending functions
    email_functions = '''
# Email sending functions
def send_verification_email(email: str, full_name: str, verification_url: str):
    """Send email verification"""
    if not SENDGRID_API_KEY:
        logger.warning("SendGrid not configured - skipping email verification")
        return
    
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail, Email, To, Content
        
        sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
        
        from_email = Email("noreply@homeverse.com", "HomeVerse")
        to_email = To(email)
        subject = "Verify your HomeVerse account"
        
        html_content = f"""
        <h2>Welcome to HomeVerse, {full_name}!</h2>
        <p>Please verify your email address to complete your registration.</p>
        <p><a href="{verification_url}" style="background-color: #14b8a6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
        <p>Or copy this link: {verification_url}</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>The HomeVerse Team</p>
        """
        
        content = Content("text/html", html_content)
        mail = Mail(from_email, to_email, subject, content)
        
        response = sg.client.mail.send.post(request_body=mail.get())
        logger.info(f"Verification email sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")

def send_password_reset_email(email: str, full_name: str, reset_url: str):
    """Send password reset email"""
    if not SENDGRID_API_KEY:
        logger.warning("SendGrid not configured - skipping password reset email")
        return
    
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail, Email, To, Content
        
        sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
        
        from_email = Email("noreply@homeverse.com", "HomeVerse")
        to_email = To(email)
        subject = "Reset your HomeVerse password"
        
        html_content = f"""
        <h2>Hi {full_name},</h2>
        <p>We received a request to reset your password.</p>
        <p><a href="{reset_url}" style="background-color: #14b8a6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>Or copy this link: {reset_url}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The HomeVerse Team</p>
        """
        
        content = Content("text/html", html_content)
        mail = Mail(from_email, to_email, subject, content)
        
        response = sg.client.mail.send.post(request_body=mail.get())
        logger.info(f"Password reset email sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send password reset email: {e}")
'''
    
    # Add before the first API endpoint
    endpoint_pattern = r'(@app\.get\("/health"\))'
    content = re.sub(endpoint_pattern, email_functions + '\n\n' + r'\1', content)
    
    # Write the updated file
    with open('simple_backend.py', 'w') as f:
        f.write(content)
    
    print("✅ Added registration infrastructure to simple_backend.py")
    print("\nNext steps:")
    print("1. Add the actual registration endpoints")
    print("2. Update the login endpoint to check email_verified")
    print("3. Add password reset endpoints")

if __name__ == "__main__":
    add_registration_features()