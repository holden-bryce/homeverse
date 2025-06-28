# 🔐 Render Environment Variables Setup Guide

**Purpose:** Configure all required environment variables in Render dashboard  
**Security Level:** HIGH - Contains production secrets  
**Time Required:** 15-20 minutes

## 🎯 Quick Setup Checklist

### Step 1: Generate Security Keys
```bash
# Run these commands to generate secure keys
echo "=== GENERATE THESE KEYS FOR RENDER ==="

# 1. Encryption Key (256-bit)
ENCRYPTION_KEY=$(openssl rand -base64 32)
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"

# 2. Encryption Salt (256-bit) 
ENCRYPTION_SALT=$(openssl rand -base64 32)
echo "ENCRYPTION_SALT=$ENCRYPTION_SALT"

# 3. JWT Secret Key (512-bit)
JWT_SECRET_KEY=$(openssl rand -hex 64)
echo "JWT_SECRET_KEY=$JWT_SECRET_KEY"

echo "=== COPY THESE VALUES TO RENDER DASHBOARD ==="
```

### Step 2: Copy to Render Dashboard
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Navigate to your `homeverse-api` service
3. Go to **Environment** tab
4. Add the variables below

## 📊 Complete Environment Variables List

### Backend Service: `homeverse-api`

#### 🔐 Security Variables (NEW - Critical)
```bash
# Generate these with commands above
ENCRYPTION_KEY=<generated-256-bit-key>
ENCRYPTION_SALT=<generated-256-bit-salt>
JWT_SECRET_KEY=<generated-512-bit-key>
```

#### 🗄️ Database Configuration (Existing)
```bash
# From your Supabase project dashboard
SUPABASE_URL=https://vzxadsifonqklotzhdpl.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eGFkc2lmb25xa2xvdHpoZHBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTUwNDQ1MCwiZXhwIjoyMDY1MDgwNDUwfQ.gXduNJebu3W2X1jCYMruxHV5Yq-IOkZ4eGN9gMBAUJ4
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eGFkc2lmb25xa2xvdHpoZHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MDQ0NTAsImV4cCI6MjA2NTA4MDQ1MH0.ZY31NHg6qamLBVeHT5Lo-ud0K_ayPh8DRamK5AUJ6t4
```

#### 🚦 Rate Limiting (NEW)
```bash
# Will be auto-generated when Redis service is created
REDIS_URL=redis://homeverse-redis:6379
```

#### 🌐 CORS & Environment (Updated)
```bash
# Fixed in render.yaml - no manual setting needed
ENVIRONMENT=production
CORS_ORIGINS=https://homeverse-frontend.onrender.com,https://homeverse.com
LOG_LEVEL=info
PYTHONPATH=.
```

#### 📧 External Services (Existing)
```bash
# SendGrid for email
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here

# OpenAI for embeddings (optional)
OPENAI_API_KEY=sk-your_openai_key_here
```

### Frontend Service: `homeverse-frontend`

#### 🌐 Public Configuration
```bash
# Supabase public keys (safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://vzxadsifonqklotzhdpl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eGFkc2lmb25xa2xvdHpoZHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MDQ0NTAsImV4cCI6MjA2NTA4MDQ1MH0.ZY31NHg6qamLBVeHT5Lo-ud0K_ayPh8DRamK5AUJ6t4

# API connection (fixed in render.yaml)
NEXT_PUBLIC_API_URL=https://homeverse-api.onrender.com

# Mapbox for maps
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiaG9sZGVuYnJ5Y2UiLCJhIjoiY21iaml2MmpiMGZzbDJqcHZ3ZjYzY25lMiJ9.AxpeDrJxeVfemXWSfLHQqw

# Environment (fixed in render.yaml)
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production
```

## 🔄 Step-by-Step Render Setup

### 1. Create Redis Service First
```yaml
# In Render dashboard, create new Redis service:
Name: homeverse-redis
Plan: Starter ($7/month)
Region: Oregon
Max Memory Policy: allkeys-lru
```

### 2. Update Backend Service Environment
```bash
# In homeverse-api service Environment tab:

# Add NEW security variables:
ENCRYPTION_KEY → [paste generated key]
ENCRYPTION_SALT → [paste generated salt] 
JWT_SECRET_KEY → [paste generated JWT secret]
REDIS_URL → [will auto-populate when Redis service is linked]

# Verify existing variables are still set:
SUPABASE_URL → [existing value]
SUPABASE_SERVICE_KEY → [existing value]
SUPABASE_ANON_KEY → [existing value]
SENDGRID_API_KEY → [existing value]
OPENAI_API_KEY → [existing value]
```

### 3. Update Frontend Service Environment
```bash
# In homeverse-frontend service Environment tab:
NEXT_PUBLIC_SUPABASE_URL → [existing value]
NEXT_PUBLIC_SUPABASE_ANON_KEY → [existing value]
NEXT_PUBLIC_MAPBOX_TOKEN → [existing value]

# The following are set automatically via render.yaml:
# NEXT_PUBLIC_API_URL=https://homeverse-api.onrender.com
# NODE_ENV=production
# NEXT_PUBLIC_ENVIRONMENT=production
```

## 🔐 Security Best Practices

### ✅ DO:
- ✅ Generate new encryption keys for production
- ✅ Use 256-bit keys for encryption, 512-bit for JWT
- ✅ Copy keys directly from terminal to Render (no intermediate storage)
- ✅ Verify all variables are set before deployment
- ✅ Use Redis service for rate limiting storage

### ❌ DON'T:
- ❌ Reuse development keys in production
- ❌ Store keys in files or messages
- ❌ Use weak passwords or predictable secrets
- ❌ Share service role keys with frontend
- ❌ Commit any keys to version control

## 🧪 Environment Validation

### Backend Validation Script
```python
# test_environment.py
import os
import sys

def validate_backend_environment():
    """Validate all required backend environment variables"""
    
    required_vars = {
        'SUPABASE_URL': 'Supabase database connection',
        'SUPABASE_SERVICE_KEY': 'Supabase admin access',
        'SUPABASE_ANON_KEY': 'Supabase public access',
        'ENCRYPTION_KEY': 'PII encryption key',
        'ENCRYPTION_SALT': 'PII encryption salt',
        'JWT_SECRET_KEY': 'JWT token signing',
        'REDIS_URL': 'Rate limiting storage',
        'ENVIRONMENT': 'Runtime environment'
    }
    
    missing = []
    weak = []
    
    for var, description in required_vars.items():
        value = os.getenv(var)
        
        if not value:
            missing.append(f"❌ {var}: {description}")
        elif var in ['ENCRYPTION_KEY', 'ENCRYPTION_SALT'] and len(value) < 40:
            weak.append(f"⚠️ {var}: May be too short for security")
        elif var == 'JWT_SECRET_KEY' and len(value) < 64:
            weak.append(f"⚠️ {var}: Should be 512-bit (128 chars)")
        else:
            print(f"✅ {var}: Set correctly")
    
    if missing:
        print("\n🚨 MISSING VARIABLES:")
        for var in missing:
            print(f"  {var}")
        return False
    
    if weak:
        print("\n⚠️ WEAK VARIABLES:")
        for var in weak:
            print(f"  {var}")
    
    print(f"\n🎯 Environment validation: {'✅ PASSED' if not missing else '❌ FAILED'}")
    return len(missing) == 0

if __name__ == "__main__":
    success = validate_backend_environment()
    sys.exit(0 if success else 1)
```

### Frontend Validation Script
```javascript
// validate_frontend_env.js
function validateFrontendEnvironment() {
    const required = {
        'NEXT_PUBLIC_SUPABASE_URL': 'Supabase connection',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Supabase public key',
        'NEXT_PUBLIC_API_URL': 'Backend API connection',
        'NEXT_PUBLIC_MAPBOX_TOKEN': 'Map functionality',
        'NODE_ENV': 'Environment mode'
    };
    
    const missing = [];
    const issues = [];
    
    for (const [key, description] of Object.entries(required)) {
        const value = process.env[key];
        
        if (!value) {
            missing.push(`❌ ${key}: ${description}`);
        } else if (key === 'NEXT_PUBLIC_API_URL' && !value.includes('render.com')) {
            issues.push(`⚠️ ${key}: Should point to Render backend`);
        } else {
            console.log(`✅ ${key}: Set correctly`);
        }
    }
    
    if (missing.length > 0) {
        console.log('\n🚨 MISSING VARIABLES:');
        missing.forEach(msg => console.log(`  ${msg}`));
        return false;
    }
    
    if (issues.length > 0) {
        console.log('\n⚠️ CONFIGURATION ISSUES:');
        issues.forEach(msg => console.log(`  ${msg}`));
    }
    
    console.log(`\n🎯 Frontend validation: ${missing.length === 0 ? '✅ PASSED' : '❌ FAILED'}`);
    return missing.length === 0;
}

validateFrontendEnvironment();
```

## 🚨 Emergency Environment Reset

### If Variables Are Compromised
```bash
#!/bin/bash
# emergency_key_rotation.sh

echo "🚨 Rotating compromised keys..."

# Generate new keys
NEW_ENCRYPTION_KEY=$(openssl rand -base64 32)
NEW_ENCRYPTION_SALT=$(openssl rand -base64 32)
NEW_JWT_SECRET=$(openssl rand -hex 64)

echo "🔑 New keys generated:"
echo "ENCRYPTION_KEY=$NEW_ENCRYPTION_KEY"
echo "ENCRYPTION_SALT=$NEW_ENCRYPTION_SALT"
echo "JWT_SECRET_KEY=$NEW_JWT_SECRET"

echo "⚠️ UPDATE THESE IN RENDER DASHBOARD IMMEDIATELY"
echo "⚠️ EXISTING ENCRYPTED DATA WILL NEED MIGRATION"
echo "⚠️ ALL USERS WILL NEED TO RE-LOGIN"
```

### If Redis URL Changes
```bash
# Update Redis connection in Render dashboard
# Old URL: redis://old-instance:6379
# New URL: redis://new-instance:6379

# No code changes needed - environment variable handles this
```

## 📊 Environment Monitoring

### Health Check Integration
```python
# Add to supabase_backend.py health endpoint
@app.get("/health/environment")
async def environment_health():
    """Check environment configuration health"""
    
    status = {
        "encryption_service": "unknown",
        "redis_connection": "unknown", 
        "supabase_connection": "unknown",
        "environment_mode": os.getenv("ENVIRONMENT", "unknown")
    }
    
    # Test encryption
    try:
        encryption = PIIEncryption()
        test_data = encryption.encrypt("test")
        decrypted = encryption.decrypt(test_data)
        status["encryption_service"] = "healthy" if decrypted == "test" else "failed"
    except Exception as e:
        status["encryption_service"] = f"error: {str(e)}"
    
    # Test Redis
    try:
        import redis
        redis_client = redis.from_url(os.getenv("REDIS_URL"))
        redis_client.ping()
        status["redis_connection"] = "healthy"
    except Exception as e:
        status["redis_connection"] = f"error: {str(e)}"
    
    # Test Supabase
    try:
        result = supabase.table("users").select("count", count="exact").execute()
        status["supabase_connection"] = "healthy"
    except Exception as e:
        status["supabase_connection"] = f"error: {str(e)}"
    
    overall_healthy = all(
        val == "healthy" 
        for key, val in status.items() 
        if key != "environment_mode"
    )
    
    return {
        "status": "healthy" if overall_healthy else "unhealthy",
        "details": status,
        "timestamp": datetime.utcnow().isoformat()
    }
```

## ✅ Final Verification Checklist

### Before Deployment
- [ ] All 8 backend environment variables set in Render
- [ ] All 5 frontend environment variables set in Render  
- [ ] Redis service created and linked
- [ ] No hardcoded secrets in code
- [ ] Environment validation scripts pass
- [ ] Health check endpoints respond correctly

### After Deployment
- [ ] `/health` endpoint returns healthy
- [ ] `/health/environment` endpoint shows all services healthy
- [ ] Rate limiting works (test failed logins)
- [ ] PII encryption working (test data creation)
- [ ] Frontend connects to backend correctly
- [ ] No console errors or warnings

---

**⚠️ CRITICAL**: Do not proceed with deployment until ALL environment variables are properly set in Render dashboard. Missing variables will cause immediate deployment failure.