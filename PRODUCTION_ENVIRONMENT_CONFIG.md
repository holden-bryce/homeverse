# 🔧 Production Environment Configuration

**Version**: 1.0  
**Last Updated**: June 8, 2025  
**Environment**: Production (Render)

## 🎯 Environment Configuration Strategy

This document provides a complete guide for configuring production environment variables, secrets management, and environment-specific settings.

## 📋 Complete Environment Variables List

### 🔴 Critical Variables (Required)

#### Backend API (`homeverse-api`)
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/homeverse  # Auto-set by Render
DATABASE_PATH=homeverse_demo.db  # Fallback for SQLite

# Security
JWT_SECRET_KEY=<generate-with-openssl-rand-base64-32>
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# API Configuration
PORT=8000
WORKERS=4
LOG_LEVEL=INFO
API_VERSION=2.0.0

# CORS
CORS_ORIGINS=https://homeverse-frontend.onrender.com,https://www.homeverse.com
CORS_CREDENTIALS=true
CORS_METHODS=["GET","POST","PUT","DELETE","OPTIONS"]
CORS_HEADERS=["*"]

# Company Configuration
COMPANY_KEY=default-company-key
DEFAULT_COMPANY_NAME=HomeVerse Demo
```

#### Frontend (`homeverse-frontend`)
```bash
# API Connection
NEXT_PUBLIC_API_URL=https://homeverse-api.onrender.com
NEXT_PUBLIC_WS_URL=wss://homeverse-api.onrender.com

# Maps
NEXT_PUBLIC_MAPBOX_TOKEN=<your-mapbox-token>

# App Configuration
PORT=3000
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 🟡 Integration Variables (Required for Features)

```bash
# Email Service (SendGrid)
SENDGRID_API_KEY=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
SENDGRID_FROM_EMAIL=noreply@homeverse.com
SENDGRID_FROM_NAME=HomeVerse Platform
CONTACT_EMAIL=holdenbryce06@gmail.com

# AI Features (Optional but Recommended)
OPENAI_API_KEY=<your-openai-key>
OPENAI_MODEL=text-embedding-3-small
OPENAI_MAX_TOKENS=8191

# Document Processing (Optional)
UNSTRUCTURED_API_KEY=<your-unstructured-key>
UNSTRUCTURED_API_URL=https://api.unstructured.io

# File Storage
MAX_UPLOAD_SIZE=10485760  # 10MB
ALLOWED_EXTENSIONS=pdf,doc,docx,txt,jpg,jpeg,png
UPLOAD_DIR=/app/uploads
```

### 🟢 Monitoring & Performance Variables

```bash
# Monitoring
SENTRY_DSN=<your-sentry-dsn>
ENABLE_METRICS=true
METRICS_PORT=9090

# Redis (When Added)
REDIS_URL=redis://default:password@host:6379
REDIS_MAX_CONNECTIONS=50
CACHE_TTL=3600

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000

# Performance
ENABLE_COMPRESSION=true
ENABLE_CACHE_HEADERS=true
STATIC_FILE_MAX_AGE=31536000
```

## 🔐 Secrets Management

### Generating Secure Secrets

```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate API Keys
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate Database Password
openssl rand -base64 24 | tr -d "=+/" | cut -c1-16
```

### Render Secret Management

1. **Via Dashboard**:
   - Navigate to service → Environment tab
   - Click "Add Environment Variable"
   - Mark sensitive values as "Secret"

2. **Via CLI**:
```bash
curl -X PATCH \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  https://api.render.com/v1/services/srv-d11f4godl3ps73cnfr6g/env-vars \
  -d '[
    {
      "key": "JWT_SECRET_KEY",
      "value": "your-secret-here"
    }
  ]'
```

### Secret Rotation Schedule

| Secret | Rotation Frequency | Last Rotated | Next Rotation |
|--------|-------------------|--------------|---------------|
| JWT_SECRET_KEY | 90 days | Jun 8, 2025 | Sep 6, 2025 |
| Database Password | 180 days | Jun 8, 2025 | Dec 5, 2025 |
| API Keys | 365 days | Jun 8, 2025 | Jun 8, 2026 |

## 🌍 Environment-Specific Configurations

### Development
```bash
# .env.development
NODE_ENV=development
DATABASE_URL=sqlite:///homeverse_dev.db
CORS_ORIGINS=*
LOG_LEVEL=DEBUG
ENABLE_SWAGGER=true
```

### Staging
```bash
# .env.staging
NODE_ENV=staging
DATABASE_URL=postgresql://user:pass@staging-db:5432/homeverse_staging
CORS_ORIGINS=https://staging.homeverse.com
LOG_LEVEL=INFO
ENABLE_SWAGGER=true
```

### Production
```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/homeverse
CORS_ORIGINS=https://homeverse.com,https://www.homeverse.com
LOG_LEVEL=WARNING
ENABLE_SWAGGER=false
```

## 🚀 Deployment Configuration Script

```bash
#!/bin/bash
# deploy-config.sh - Configure production environment

set -e

echo "🔧 Configuring HomeVerse Production Environment"

# Check if Render CLI is available
if ! command -v render &> /dev/null; then
    echo "❌ Render CLI not found. Please install first."
    exit 1
fi

# Set API Key
export RENDER_API_KEY="rnd_KqwZ5fjRivybWcsC9PqsHel2BDt8"

# Backend Service ID
BACKEND_SERVICE="srv-d11f4godl3ps73cnfr6g"
FRONTEND_SERVICE="srv-d11f3q0dl3ps73cnf480"

# Configure Backend
echo "📦 Configuring Backend Environment..."
render env:set -s $BACKEND_SERVICE \
  JWT_SECRET_KEY="$(openssl rand -base64 32)" \
  CORS_ORIGINS="https://homeverse-frontend.onrender.com" \
  LOG_LEVEL="INFO" \
  SENDGRID_API_KEY="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" \
  CONTACT_EMAIL="holdenbryce06@gmail.com" \
  COMPANY_KEY="default-company-key" \
  PORT="8000"

# Configure Frontend
echo "📦 Configuring Frontend Environment..."
render env:set -s $FRONTEND_SERVICE \
  NEXT_PUBLIC_API_URL="https://homeverse-api.onrender.com" \
  NODE_ENV="production" \
  PORT="3000"

echo "✅ Environment configuration complete!"
```

## 🔍 Environment Validation

```python
#!/usr/bin/env python3
"""validate_env.py - Validate production environment"""

import os
import sys

required_vars = {
    'backend': [
        'DATABASE_URL',
        'JWT_SECRET_KEY',
        'SENDGRID_API_KEY',
        'CORS_ORIGINS',
        'PORT'
    ],
    'frontend': [
        'NEXT_PUBLIC_API_URL',
        'PORT'
    ]
}

def validate_environment(service_type):
    """Validate required environment variables"""
    missing = []
    
    for var in required_vars.get(service_type, []):
        if not os.getenv(var):
            missing.append(var)
    
    if missing:
        print(f"❌ Missing required variables: {', '.join(missing)}")
        return False
    
    print("✅ All required environment variables present")
    
    # Validate formats
    if service_type == 'backend':
        # Check JWT secret length
        jwt_secret = os.getenv('JWT_SECRET_KEY', '')
        if len(jwt_secret) < 32:
            print("⚠️ JWT_SECRET_KEY should be at least 32 characters")
        
        # Check CORS origins
        cors = os.getenv('CORS_ORIGINS', '')
        if '*' in cors and os.getenv('NODE_ENV') == 'production':
            print("⚠️ CORS wildcard (*) not recommended for production")
    
    return True

if __name__ == "__main__":
    service = sys.argv[1] if len(sys.argv) > 1 else 'backend'
    validate_environment(service)
```

## 📊 Environment Monitoring

```bash
# Check current environment
curl https://homeverse-api.onrender.com/system/info

# Expected response:
{
  "environment": "production",
  "version": "2.0.0",
  "database": "postgresql",
  "features": {
    "email": true,
    "ai_matching": true,
    "file_upload": true
  }
}
```

## 🔄 Configuration Updates

### Adding New Variables
1. Update service code to use new variable
2. Add to environment validation
3. Deploy with default value first
4. Update production value
5. Verify functionality

### Removing Variables
1. Deploy code that doesn't require variable
2. Remove from validation
3. Delete from Render dashboard
4. Clean up documentation

## 🚨 Common Issues & Solutions

### Issue: Environment variable not loading
```bash
# Debug steps:
1. Check Render dashboard for typos
2. Verify variable is not marked as "Build-time only"
3. Restart service: render services:restart $SERVICE_ID
4. Check logs: render logs $SERVICE_ID
```

### Issue: CORS errors in production
```bash
# Fix:
1. Verify CORS_ORIGINS includes frontend URL
2. Check for trailing slashes
3. Ensure credentials are allowed
4. Test with: curl -I -X OPTIONS $API_URL
```

### Issue: Database connection failures
```bash
# Fix:
1. Verify DATABASE_URL is set correctly
2. Check connection pool settings
3. Ensure database is not at connection limit
4. Test with: psql $DATABASE_URL -c "SELECT 1"
```

## 📋 Environment Checklist

### Pre-Deployment
- [ ] All required variables documented
- [ ] Secrets generated securely
- [ ] Validation script passes
- [ ] Backup of current configuration

### Post-Deployment
- [ ] All features working
- [ ] No hardcoded values in code
- [ ] Monitoring shows healthy
- [ ] Documentation updated

---

**Security Note**: Never commit `.env` files or expose secrets in logs. Use Render's secret management for all sensitive values.