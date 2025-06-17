# 🚨 HomeVerse Security Action Plan

## Phase 1: Critical Fixes (Do Immediately)

### 1. Remove Service Role Key from Frontend
```bash
# In frontend/.env.local and .env.production
# REMOVE THIS LINE:
SUPABASE_SERVICE_ROLE_KEY=xxx

# This key should ONLY exist in backend services, never in frontend
```

### 2. Add Security Headers
Create `src/app/layout.tsx` headers:
```typescript
export async function generateMetadata() {
  return {
    other: {
      'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval';",
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    }
  }
}
```

### 3. Fix CORS Configuration
Update `next.config.js`:
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
        ]
      }
    ]
  }
}
```

### 4. Add Input Validation
Create `src/lib/validation/sanitize.ts`:
```typescript
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  }).slice(0, 1000)
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length < 255
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/
  return phoneRegex.test(phone) && phone.length < 20
}
```

### 5. Implement Rate Limiting
Create `src/lib/rate-limit.ts`:
```typescript
const rateLimit = new Map()

export function checkRateLimit(identifier: string, limit = 10, window = 60000) {
  const now = Date.now()
  const userLimits = rateLimit.get(identifier) || []
  
  const recentRequests = userLimits.filter((time: number) => now - time < window)
  
  if (recentRequests.length >= limit) {
    return false
  }
  
  recentRequests.push(now)
  rateLimit.set(identifier, recentRequests)
  
  return true
}
```

## Phase 2: High Priority (Within 1 Week)

### 1. Encrypt Sensitive Data
```typescript
// src/lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const algorithm = 'aes-256-gcm'
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')

export function encrypt(text: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(algorithm, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

export function decrypt(text: string): string {
  const parts = text.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]
  
  const decipher = createDecipheriv(algorithm, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
```

### 2. Add Audit Logging
```typescript
// src/lib/audit.ts
interface AuditLog {
  user_id: string
  action: string
  resource_type: string
  resource_id?: string
  changes?: Record<string, any>
  ip_address?: string
  user_agent?: string
  timestamp: Date
}

export async function logAudit(log: AuditLog) {
  const supabase = createClient()
  
  await supabase.from('audit_logs').insert({
    ...log,
    timestamp: new Date().toISOString()
  })
}
```

### 3. Implement Session Security
```typescript
// Add to middleware.ts
const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes

export async function middleware(request: NextRequest) {
  // ... existing code ...
  
  // Check session age
  const sessionAge = Date.now() - (session.created_at * 1000)
  if (sessionAge > SESSION_TIMEOUT) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/auth/login?expired=true', request.url))
  }
}
```

## Phase 3: Compliance (Within 1 Month)

### 1. GDPR Compliance
- Add data export functionality
- Implement "right to be forgotten"
- Create consent management
- Add cookie banner

### 2. Audit Trail
- Log all data access
- Track all modifications
- Record login attempts
- Monitor API usage

### 3. Data Retention
- Implement automatic data purging
- Archive old records
- Anonymize inactive accounts

## Security Testing Checklist

- [ ] Run OWASP ZAP security scan
- [ ] Perform dependency audit: `npm audit`
- [ ] Check for secrets: `trufflehog`
- [ ] Test rate limiting
- [ ] Verify HTTPS everywhere
- [ ] Test session timeout
- [ ] Check error messages don't leak data
- [ ] Verify input sanitization
- [ ] Test file upload restrictions
- [ ] Check for SQL injection
- [ ] Test XSS prevention
- [ ] Verify CSRF protection

## Monitoring & Alerts

Set up alerts for:
- Failed login attempts > 5
- Unusual data access patterns
- API rate limit violations
- Error rate spikes
- Large data exports
- Privilege escalation attempts

## Regular Security Tasks

### Daily
- Review security alerts
- Check for unusual activity

### Weekly
- Review audit logs
- Update dependencies
- Check for CVEs

### Monthly
- Security training
- Penetration testing
- Compliance review

### Quarterly
- Full security audit
- Update security policies
- Disaster recovery drill