# ✅ HomeVerse Production Environment Configuration Checklist

**Last Updated:** December 28, 2024  
**Purpose:** Complete checklist for production environment setup  
**Time Required:** 4-6 hours

## 🔐 Security Configuration

### Encryption & Keys
- [ ] Generate new AES-256 encryption key for PII
  ```bash
  openssl rand -base64 32 > encryption.key
  # Store in secure vault, never commit
  ```
- [ ] Rotate JWT secret key
  ```bash
  openssl rand -hex 64 > jwt.secret
  ```
- [ ] Remove all service role keys from .env files
- [ ] Set up key rotation schedule (90 days)
- [ ] Configure HashiCorp Vault or AWS Secrets Manager
- [ ] Enable audit logging for key access

### SSL/TLS Configuration
- [ ] Verify SSL certificates (A+ rating)
  ```bash
  # Test with SSL Labs
  https://www.ssllabs.com/ssltest/analyze.html?d=homeverse-api.onrender.com
  ```
- [ ] Enable HSTS with preload
- [ ] Configure TLS 1.2 minimum
- [ ] Disable weak ciphers
- [ ] Set up certificate auto-renewal
- [ ] Configure OCSP stapling

### CORS & Headers
- [ ] Set production CORS origins
  ```python
  CORS_ORIGINS = [
      "https://homeverse-frontend.onrender.com",
      "https://www.homeverse.com",
      "https://homeverse.com"
  ]
  ```
- [ ] Configure security headers
  ```python
  SECURITY_HEADERS = {
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  }
  ```

## 🗄️ Database Configuration

### Supabase Production Setup
- [ ] Enable connection pooling
  ```sql
  -- Set optimal pool size
  ALTER DATABASE postgres SET max_connections = 100;
  ALTER DATABASE postgres SET shared_buffers = '256MB';
  ```
- [ ] Configure RLS policies
  ```sql
  -- Verify all tables have RLS
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public';
  ```
- [ ] Create production indexes
  ```sql
  -- Performance indexes
  CREATE INDEX CONCURRENTLY idx_applicants_company_status 
    ON applicants(company_id, status) 
    WHERE deleted_at IS NULL;
    
  CREATE INDEX CONCURRENTLY idx_projects_location 
    ON projects USING GIST (location);
    
  CREATE INDEX CONCURRENTLY idx_encrypted_search 
    ON applicants(encrypted_ssn, encrypted_email);
  ```
- [ ] Set up automated backups
  ```bash
  # Verify backup schedule
  pg_dump --format=custom --no-acl --no-owner \
    $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).dump
  ```
- [ ] Configure read replicas for analytics
- [ ] Set up point-in-time recovery

### Data Migration
- [ ] Create migration rollback plan
- [ ] Test PII encryption migration on copy
- [ ] Prepare batch processing scripts
- [ ] Set up progress monitoring
- [ ] Create verification queries
- [ ] Document recovery procedures

## 🌐 Application Configuration

### Environment Variables
- [ ] Backend (.env.production)
  ```bash
  # Core
  ENVIRONMENT=production
  API_BASE_URL=https://homeverse-api.onrender.com
  LOG_LEVEL=info
  
  # Security
  ENCRYPTION_KEY=<from-vault>
  JWT_SECRET_KEY=<from-vault>
  SESSION_TIMEOUT=3600
  
  # Database
  DATABASE_URL=<production-supabase-url>
  DATABASE_POOL_MIN=5
  DATABASE_POOL_MAX=20
  
  # Redis
  REDIS_URL=<production-redis-url>
  REDIS_MAX_CONNECTIONS=50
  
  # Services
  SENDGRID_API_KEY=<production-key>
  SENDGRID_FROM_EMAIL=noreply@homeverse.com
  MAPBOX_TOKEN=<production-token>
  
  # Monitoring
  SENTRY_DSN=<production-dsn>
  DATADOG_API_KEY=<production-key>
  ```

- [ ] Frontend (.env.production)
  ```bash
  # API
  NEXT_PUBLIC_API_URL=https://homeverse-api.onrender.com
  NEXT_PUBLIC_ENVIRONMENT=production
  
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL=https://zlfnxemyyvxzxheajzgb.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
  
  # Analytics
  NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
  NEXT_PUBLIC_MIXPANEL_TOKEN=<production-token>
  
  # Features
  NEXT_PUBLIC_ENABLE_PWA=true
  NEXT_PUBLIC_ENABLE_ANALYTICS=true
  ```

### Rate Limiting Configuration
- [ ] Configure Redis for rate limiting
  ```python
  # Rate limit settings
  RATE_LIMITS = {
      "login": {
          "per_minute": 5,
          "per_hour": 30,
          "per_day": 100
      },
      "api_authenticated": {
          "per_minute": 60,
          "per_hour": 1000,
          "per_day": 10000
      },
      "api_anonymous": {
          "per_minute": 20,
          "per_hour": 100,
          "per_day": 500
      },
      "password_reset": {
          "per_hour": 5,
          "per_day": 10
      }
  }
  ```
- [ ] Set up IP allowlist for admin
- [ ] Configure burst handling
- [ ] Set up rate limit monitoring
- [ ] Create bypass tokens for services

## 🚀 Infrastructure Setup

### Render.com Configuration
- [ ] Configure auto-scaling
  ```yaml
  # render.yaml
  services:
    - type: web
      name: homeverse-api
      env: node
      plan: pro
      scaling:
        minInstances: 2
        maxInstances: 10
        targetMemoryPercent: 80
        targetCPUPercent: 70
  ```
- [ ] Set up health checks
  ```python
  @app.get("/health")
  async def health_check():
      checks = {
          "api": "healthy",
          "database": await check_database(),
          "redis": await check_redis(),
          "encryption": await check_encryption()
      }
      
      if all(v == "healthy" for v in checks.values()):
          return {"status": "healthy", "checks": checks}
      else:
          return JSONResponse(
              status_code=503,
              content={"status": "unhealthy", "checks": checks}
          )
  ```
- [ ] Configure deployment hooks
- [ ] Set up zero-downtime deployments
- [ ] Configure custom domains
- [ ] Set up DDoS protection

### CDN Configuration
- [ ] Set up Cloudflare
  ```yaml
  # Page Rules
  - URL: https://homeverse.com/api/*
    Cache Level: Bypass
    
  - URL: https://homeverse.com/static/*
    Cache Level: Aggressive
    Edge Cache TTL: 1 month
    
  - URL: https://homeverse.com/*
    Cache Level: Standard
    Browser Cache TTL: 4 hours
  ```
- [ ] Configure image optimization
- [ ] Set up Brotli compression
- [ ] Configure security rules
- [ ] Set up geographic routing
- [ ] Enable Web Application Firewall

### Monitoring Infrastructure
- [ ] Install Datadog agent
  ```bash
  DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=<key> DD_SITE="datadoghq.com" \
    bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"
  ```
- [ ] Configure application monitoring
- [ ] Set up custom metrics
- [ ] Create dashboards
- [ ] Configure log aggregation
- [ ] Set up synthetic monitoring

## 📊 Performance Optimization

### Backend Optimization
- [ ] Enable response compression
  ```python
  from fastapi.middleware.gzip import GZipMiddleware
  app.add_middleware(GZipMiddleware, minimum_size=1000)
  ```
- [ ] Configure connection pooling
- [ ] Set up query optimization
- [ ] Enable prepared statements
- [ ] Configure caching strategy
- [ ] Optimize JSON serialization

### Frontend Optimization
- [ ] Enable Next.js production optimizations
  ```javascript
  // next.config.js
  module.exports = {
    swcMinify: true,
    compress: true,
    poweredByHeader: false,
    generateEtags: true,
    images: {
      domains: ['homeverse.com'],
      formats: ['image/avif', 'image/webp']
    }
  }
  ```
- [ ] Configure service worker
- [ ] Set up code splitting
- [ ] Enable tree shaking
- [ ] Optimize bundle size
- [ ] Configure prefetching

## 🔍 Testing & Validation

### Security Testing
- [ ] Run OWASP ZAP scan
- [ ] Perform penetration testing
- [ ] Verify encryption implementation
- [ ] Test rate limiting effectiveness
- [ ] Validate CORS configuration
- [ ] Check for exposed secrets

### Performance Testing
- [ ] Load test with expected traffic
  ```bash
  # Using k6
  k6 run --vus 100 --duration 30m load-test.js
  ```
- [ ] Test with slow networks
- [ ] Verify mobile performance
- [ ] Check database query performance
- [ ] Monitor memory usage
- [ ] Test auto-scaling triggers

### Functionality Testing
- [ ] Complete user journey tests
- [ ] Test all authentication flows
- [ ] Verify data encryption/decryption
- [ ] Test form submissions
- [ ] Verify email delivery
- [ ] Check real-time features

## 📨 Communication Setup

### User Notifications
- [ ] Prepare maintenance page
- [ ] Create status page
- [ ] Set up user email templates
- [ ] Configure in-app notifications
- [ ] Prepare FAQ updates
- [ ] Schedule social media posts

### Team Communication
- [ ] Set up Slack channels
  - #deployment-status
  - #production-alerts
  - #user-feedback
- [ ] Configure PagerDuty
- [ ] Create escalation matrix
- [ ] Document on-call schedule
- [ ] Set up war room procedures

## 🎯 Final Verification

### Pre-Launch Checklist
- [ ] All environment variables set
- [ ] Secrets stored securely
- [ ] Monitoring dashboards ready
- [ ] Alerting rules configured
- [ ] Backup systems tested
- [ ] Rollback procedures documented
- [ ] Team briefed and ready
- [ ] Support team prepared
- [ ] Legal compliance verified
- [ ] Executive sign-off received

### Launch Readiness Score
Calculate your readiness score:
- Security items complete: ___/25 (25%)
- Infrastructure items complete: ___/20 (20%)
- Configuration items complete: ___/20 (20%)
- Testing items complete: ___/18 (18%)
- Monitoring items complete: ___/12 (12%)
- Communication items complete: ___/5 (5%)

**Total Score: ___/100**

✅ **90-100**: Ready for production  
⚠️ **70-89**: Address remaining items  
🚫 **Below 70**: Not ready, continue preparation

---

## 📝 Sign-Off

- [ ] Engineering Lead: _________________ Date: _______
- [ ] Security Lead: ___________________ Date: _______
- [ ] DevOps Lead: ____________________ Date: _______
- [ ] Product Manager: _________________ Date: _______
- [ ] CTO: ____________________________ Date: _______

**Notes/Concerns:**
```
[Add any deployment notes or concerns here]
```