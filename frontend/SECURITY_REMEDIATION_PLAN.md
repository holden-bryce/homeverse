# 🔐 Security Remediation Plan for HomeVerse

## Phase 1: Critical Security (Week 1-2) 🚨

### 1. Input Validation & Sanitization
```typescript
// Install dependencies
npm install validator dompurify @types/dompurify

// Create validation middleware
// src/lib/security/validation.ts
import validator from 'validator'
import DOMPurify from 'dompurify'

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(validator.escape(input))
}

export function validateEmail(email: string): boolean {
  return validator.isEmail(email)
}

export function validatePhone(phone: string): boolean {
  return validator.isMobilePhone(phone, 'en-US')
}

export function validateIncome(income: number): boolean {
  return income >= 0 && income <= 10000000
}
```

### 2. Security Headers
```typescript
// src/middleware.ts - Add security headers
import { NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy
  response.headers.set('Content-Security-Policy', `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.mapbox.com;
    style-src 'self' 'unsafe-inline' https://api.mapbox.com;
    img-src 'self' data: blob: https://*.supabase.co https://api.mapbox.com;
    font-src 'self';
    connect-src 'self' https://*.supabase.co https://api.mapbox.com;
    frame-ancestors 'none';
  `.replace(/\n/g, ''))
  
  return response
}
```

### 3. Rate Limiting
```typescript
// Install: npm install express-rate-limit
// src/lib/security/rateLimiter.ts
import { LRUCache } from 'lru-cache'

type Options = {
  uniqueTokenPerInterval?: number
  interval?: number
}

export function rateLimit(options?: Options) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  })

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0]
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount)
        }
        tokenCount[0] += 1

        const currentUsage = tokenCount[0]
        const isRateLimited = currentUsage >= limit
        
        return isRateLimited ? reject() : resolve()
      }),
  }
}
```

### 4. Error Boundaries
```typescript
// src/app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Log to monitoring service
  console.error('Application error:', error.digest)
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="mt-2 text-gray-600">
          We apologize for the inconvenience. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 bg-teal-600 text-white rounded"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
```

## Phase 2: Authentication Hardening (Week 3-4) 🔐

### 1. Multi-Factor Authentication
```typescript
// Enable in Supabase Dashboard
// Then update auth flow:
// src/lib/auth/mfa.ts
export async function enableMFA(userId: string) {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp'
  })
  
  if (error) throw error
  return data
}

export async function verifyMFA(code: string, factorId: string) {
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    code
  })
  
  if (error) throw error
  return data
}
```

### 2. Password Policy
```typescript
// src/lib/auth/passwordPolicy.ts
export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number')
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain special character')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
```

### 3. Session Management
```typescript
// src/lib/auth/session.ts
const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes

export function setupSessionTimeout() {
  let timeout: NodeJS.Timeout
  
  const resetTimeout = () => {
    clearTimeout(timeout)
    timeout = setTimeout(async () => {
      await supabase.auth.signOut()
      window.location.href = '/auth/login?reason=timeout'
    }, SESSION_TIMEOUT)
  }
  
  // Reset on user activity
  window.addEventListener('click', resetTimeout)
  window.addEventListener('keypress', resetTimeout)
  window.addEventListener('scroll', resetTimeout)
  
  resetTimeout()
}
```

## Phase 3: Data Protection (Week 5-6) 🛡️

### 1. Field-Level Encryption
```typescript
// src/lib/security/encryption.ts
import crypto from 'crypto'

const algorithm = 'aes-256-gcm'
const secretKey = process.env.ENCRYPTION_KEY!

export function encryptPII(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

export function decryptPII(encryptedData: string): string {
  const parts = encryptedData.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]
  
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
```

### 2. Audit Logging
```typescript
// src/lib/security/audit.ts
interface AuditLog {
  user_id: string
  action: string
  resource_type: string
  resource_id?: string
  ip_address: string
  user_agent: string
  timestamp: Date
  details?: Record<string, any>
}

export async function logAuditEvent(event: AuditLog) {
  await supabase.from('audit_logs').insert({
    ...event,
    timestamp: new Date().toISOString()
  })
}

// Usage in actions
export async function createApplicantWithAudit(formData: FormData) {
  const user = await getUser()
  
  // Create applicant
  const applicant = await createApplicant(formData)
  
  // Log audit event
  await logAuditEvent({
    user_id: user.id,
    action: 'CREATE_APPLICANT',
    resource_type: 'applicant',
    resource_id: applicant.id,
    ip_address: request.headers.get('x-forwarded-for'),
    user_agent: request.headers.get('user-agent'),
    details: {
      applicant_name: `${formData.get('first_name')} ${formData.get('last_name')}`
    }
  })
}
```

### 3. Data Masking
```typescript
// src/lib/security/masking.ts
export function maskSSN(ssn: string): string {
  return ssn.replace(/(\d{3})(\d{2})(\d{4})/, '***-**-$3')
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  const maskedLocal = local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
  return `${maskedLocal}@${domain}`
}

export function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) ***-**$3')
}

export function maskIncome(income: number): string {
  if (income < 50000) return 'Under $50k'
  if (income < 100000) return '$50k-$100k'
  if (income < 200000) return '$100k-$200k'
  return 'Over $200k'
}
```

## Phase 4: Compliance Implementation (Week 7-8) 📋

### 1. GDPR/CCPA Compliance
```typescript
// src/lib/compliance/privacy.ts
export async function exportUserData(userId: string) {
  const data = {
    profile: await supabase.from('profiles').select('*').eq('id', userId),
    applicants: await supabase.from('applicants').select('*').eq('user_id', userId),
    activities: await supabase.from('activities').select('*').eq('user_id', userId),
  }
  
  return data
}

export async function deleteUserData(userId: string) {
  // Soft delete with anonymization
  await supabase.from('profiles').update({
    full_name: 'DELETED USER',
    email: `deleted_${userId}@example.com`,
    phone: null,
    deleted_at: new Date().toISOString()
  }).eq('id', userId)
  
  // Hard delete sensitive data
  await supabase.from('applicants').delete().eq('user_id', userId)
  await supabase.from('activities').delete().eq('user_id', userId)
}
```

### 2. Cookie Consent
```typescript
// src/components/CookieConsent.tsx
import { useState, useEffect } from 'react'

export function CookieConsent() {
  const [show, setShow] = useState(false)
  
  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) setShow(true)
  }, [])
  
  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setShow(false)
  }
  
  if (!show) return null
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <p>
          We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
        </p>
        <div className="flex gap-4">
          <button onClick={() => window.location.href = '/privacy'}>
            Learn More
          </button>
          <button 
            onClick={acceptCookies}
            className="bg-teal-600 px-4 py-2 rounded"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 3. Fair Housing Compliance
```typescript
// src/lib/compliance/fairHousing.ts
export function addFairHousingDisclaimer() {
  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
      <p className="text-sm text-blue-800">
        <strong>Equal Housing Opportunity:</strong> All real estate advertised herein is subject to the Federal Fair Housing Act, which makes it illegal to advertise any preference, limitation, or discrimination based on race, color, religion, sex, handicap, familial status, or national origin.
      </p>
    </div>
  )
}

// Bias monitoring for matching algorithm
export async function monitorMatchingBias(matches: any[]) {
  const demographics = await analyzeDemographics(matches)
  
  if (demographics.disparityScore > 0.2) {
    await logAuditEvent({
      action: 'BIAS_ALERT',
      details: demographics
    })
  }
}
```

## Estimated Timeline & Costs

### Implementation Timeline
- **Phase 1**: 2 weeks - $20,000
- **Phase 2**: 2 weeks - $15,000  
- **Phase 3**: 2 weeks - $25,000
- **Phase 4**: 2 weeks - $20,000
- **Testing & Audit**: 2 weeks - $15,000

**Total: 10 weeks, $95,000**

### Ongoing Costs
- Security tools: $1,500/month
- Compliance tools: $1,000/month
- Security consultant: $5,000/month
- Penetration testing: $15,000/quarter

**Total: $7,500/month + $15,000/quarter**

## Next Steps

1. **Week 1**: Implement Phase 1 security fixes
2. **Week 2**: Deploy to staging for security testing
3. **Week 3-4**: Implement authentication hardening
4. **Week 5-6**: Add data protection layers
5. **Week 7-8**: Compliance implementation
6. **Week 9-10**: Security audit and penetration testing

Only after completing all phases should real user data be handled.