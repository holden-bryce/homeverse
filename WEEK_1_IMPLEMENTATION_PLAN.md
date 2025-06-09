# 📋 Week 1 Implementation Plan: Critical Security Features

## Day 1-2: User Registration System

### Backend Implementation (simple_backend.py)

```python
# 1. Add email verification imports
import secrets
from datetime import datetime, timedelta
import resend  # or stick with SendGrid

# 2. Add verification token table to database init
cursor.execute('''
    CREATE TABLE IF NOT EXISTS email_verifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
''')

# 3. Update user table to add verified status
cursor.execute('''
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE
''')

# 4. New registration endpoint
@app.post("/api/v1/auth/register")
async def register(
    email: EmailStr = Form(...),
    password: str = Form(...),
    full_name: str = Form(...),
    company_name: str = Form(...),
    role: str = Form("buyer"),
    conn=Depends(get_db)
):
    # Validate password strength
    if len(password) < 8 or not any(c.isdigit() for c in password):
        raise HTTPException(400, "Password must be 8+ characters with at least one number")
    
    # Check if user exists
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        raise HTTPException(400, "Email already registered")
    
    # Create company
    company_id = str(uuid.uuid4())
    company_key = f"{company_name.lower().replace(' ', '-')}-{secrets.token_hex(4)}"
    
    cursor.execute("""
        INSERT INTO companies (id, key, name, plan, seats)
        VALUES (?, ?, ?, 'trial', 5)
    """, (company_id, company_key, company_name))
    
    # Create user
    user_id = str(uuid.uuid4())
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    cursor.execute("""
        INSERT INTO users (id, email, password_hash, full_name, role, company_id, email_verified)
        VALUES (?, ?, ?, ?, ?, ?, FALSE)
    """, (user_id, email, password_hash, full_name, role, company_id))
    
    # Create verification token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=24)
    
    cursor.execute("""
        INSERT INTO email_verifications (id, user_id, token, expires_at)
        VALUES (?, ?, ?, ?)
    """, (str(uuid.uuid4()), user_id, token, expires_at))
    
    conn.commit()
    
    # Send verification email
    verification_url = f"https://homeverse-frontend.onrender.com/auth/verify?token={token}"
    send_verification_email(email, full_name, verification_url)
    
    return {"message": "Registration successful. Please check your email to verify your account."}

# 5. Email verification endpoint
@app.get("/api/v1/auth/verify-email")
async def verify_email(token: str, conn=Depends(get_db)):
    cursor = conn.cursor()
    
    # Check token
    cursor.execute("""
        SELECT ev.user_id, ev.expires_at, u.email
        FROM email_verifications ev
        JOIN users u ON ev.user_id = u.id
        WHERE ev.token = ? AND ev.verified_at IS NULL
    """, (token,))
    
    result = cursor.fetchone()
    if not result:
        raise HTTPException(400, "Invalid or expired verification token")
    
    user_id, expires_at, email = result
    
    # Check expiration
    if datetime.fromisoformat(expires_at) < datetime.utcnow():
        raise HTTPException(400, "Verification token has expired")
    
    # Update verification status
    cursor.execute("""
        UPDATE email_verifications 
        SET verified_at = CURRENT_TIMESTAMP 
        WHERE token = ?
    """, (token,))
    
    cursor.execute("""
        UPDATE users 
        SET email_verified = TRUE 
        WHERE id = ?
    """, (user_id,))
    
    conn.commit()
    
    return {"message": "Email verified successfully. You can now log in."}
```

### Frontend Implementation

1. **Registration Page** (`frontend/src/app/auth/register/page.tsx`)
```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
    role: 'buyer'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!/\d/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.fullName.length < 2) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (formData.companyName.length < 2) {
      newErrors.companyName = 'Company name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await api.register(formData);
      router.push('/auth/verify-email-sent');
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-center">Create your account</h2>
          <p className="mt-2 text-center text-gray-600">
            Start your journey with HomeVerse
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Form fields here */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

2. **Email Verification Page** (`frontend/src/app/auth/verify/page.tsx`)
```typescript
'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    api.verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Email verified successfully! Redirecting to login...');
        setTimeout(() => router.push('/auth/login'), 3000);
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error.message || 'Verification failed');
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Status display */}
    </div>
  );
}
```

---

## Day 3: Password Reset Flow

### Backend Implementation

```python
# 1. Password reset request
@app.post("/api/v1/auth/forgot-password")
async def forgot_password(email: EmailStr, conn=Depends(get_db)):
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT id, full_name FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    
    if user:
        user_id, full_name = user
        
        # Create reset token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=1)
        
        cursor.execute("""
            INSERT INTO password_resets (id, user_id, token, expires_at)
            VALUES (?, ?, ?, ?)
        """, (str(uuid.uuid4()), user_id, token, expires_at))
        
        conn.commit()
        
        # Send reset email
        reset_url = f"https://homeverse-frontend.onrender.com/auth/reset-password?token={token}"
        send_password_reset_email(email, full_name, reset_url)
    
    # Always return success to prevent email enumeration
    return {"message": "If the email exists, a password reset link has been sent."}

# 2. Reset password with token
@app.post("/api/v1/auth/reset-password")
async def reset_password(
    token: str = Form(...),
    password: str = Form(...),
    conn=Depends(get_db)
):
    cursor = conn.cursor()
    
    # Validate token
    cursor.execute("""
        SELECT pr.user_id, pr.expires_at
        FROM password_resets pr
        WHERE pr.token = ? AND pr.used_at IS NULL
    """, (token,))
    
    result = cursor.fetchone()
    if not result:
        raise HTTPException(400, "Invalid or expired reset token")
    
    user_id, expires_at = result
    
    if datetime.fromisoformat(expires_at) < datetime.utcnow():
        raise HTTPException(400, "Reset token has expired")
    
    # Update password
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    cursor.execute("""
        UPDATE users SET password_hash = ? WHERE id = ?
    """, (password_hash, user_id))
    
    # Mark token as used
    cursor.execute("""
        UPDATE password_resets SET used_at = CURRENT_TIMESTAMP WHERE token = ?
    """, (token,))
    
    conn.commit()
    
    return {"message": "Password reset successfully"}
```

---

## Day 4: Rate Limiting & Security

### Installation
```bash
pip install slowapi python-jose[cryptography] argon2-cffi
```

### Implementation
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Create limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply to endpoints
@app.post("/api/v1/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, form_data: LoginRequest, conn=Depends(get_db)):
    # Existing login code

@app.post("/api/v1/auth/register")
@limiter.limit("3/hour")
async def register(request: Request, ...):
    # Registration code

@app.post("/api/v1/auth/forgot-password")
@limiter.limit("3/hour")
async def forgot_password(request: Request, ...):
    # Password reset code

# API rate limiting
@app.middleware("http")
@limiter.limit("100/minute")
async def rate_limit_middleware(request: Request, call_next):
    response = await call_next(request)
    return response
```

---

## Day 5: Input Validation & Testing

### Enhanced Validation Models
```python
from pydantic import BaseModel, EmailStr, validator, constr
import re

class RegisterRequest(BaseModel):
    email: EmailStr
    password: constr(min_length=8)
    full_name: constr(min_length=2, max_length=100)
    company_name: constr(min_length=2, max_length=100)
    role: str = "buyer"
    
    @validator('password')
    def password_strength(cls, v):
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('Password must contain at least one letter')
        return v
    
    @validator('role')
    def valid_role(cls, v):
        allowed_roles = ['developer', 'lender', 'buyer', 'applicant']
        if v not in allowed_roles:
            raise ValueError(f'Role must be one of: {allowed_roles}')
        return v
    
    @validator('email')
    def email_not_blacklisted(cls, v):
        # Add disposable email check
        disposable_domains = ['tempmail.com', 'throwaway.email']
        domain = v.split('@')[1]
        if domain in disposable_domains:
            raise ValueError('Disposable email addresses are not allowed')
        return v

class SanitizedInput(BaseModel):
    """Base class for all user inputs with XSS protection"""
    
    @validator('*', pre=True)
    def sanitize_input(cls, v):
        if isinstance(v, str):
            # Remove potential XSS
            v = re.sub(r'<script.*?</script>', '', v, flags=re.IGNORECASE)
            v = re.sub(r'javascript:', '', v, flags=re.IGNORECASE)
            v = re.sub(r'on\w+\s*=', '', v, flags=re.IGNORECASE)
        return v
```

### SQL Injection Prevention
```python
# Always use parameterized queries
# GOOD:
cursor.execute("SELECT * FROM users WHERE email = ?", (email,))

# BAD (vulnerable):
cursor.execute(f"SELECT * FROM users WHERE email = '{email}'")

# For PostgreSQL:
cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
```

---

## Testing Checklist

### Security Tests
- [ ] Try SQL injection in all forms
- [ ] Test XSS in text inputs
- [ ] Verify rate limiting works
- [ ] Check password strength validation
- [ ] Test token expiration
- [ ] Verify email enumeration protection

### Functional Tests
- [ ] Register new user
- [ ] Verify email
- [ ] Login with verified account
- [ ] Login with unverified account (should fail)
- [ ] Reset password flow
- [ ] Try expired tokens

### Load Tests
```bash
# Install locust
pip install locust

# Create locustfile.py
from locust import HttpUser, task, between

class BetaUser(HttpUser):
    wait_time = between(1, 3)
    
    @task
    def login(self):
        self.client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
    
    @task
    def view_projects(self):
        self.client.get("/api/v1/projects")

# Run load test
locust -f locustfile.py -H https://homeverse-api.onrender.com
```

---

## Deployment Commands

```bash
# After implementing each feature:
git add -A
git commit -m "feat: Add user registration with email verification"
git push origin main

# Monitor deployment
watch curl https://homeverse-api.onrender.com/health

# Test endpoints
curl -X POST https://homeverse-api.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", ...}'
```