# 🔐 Production Security Checklist for HomeVerse

## 🎯 Overview
This checklist ensures your HomeVerse application is secure for production use with proper Row Level Security (RLS) and authentication.

## ✅ Pre-Production Security Checklist

### 1. **Database Security**
- [ ] Enable RLS on all tables
- [ ] Apply production RLS policies (use `production_rls_policies.sql`)
- [ ] Remove any test data from production database
- [ ] Disable public access to database (except via API)
- [ ] Rotate all database passwords

### 2. **Authentication Security**
- [ ] Ensure all users have strong passwords
- [ ] Enable email confirmation for new users
- [ ] Set up password reset flow
- [ ] Configure session timeout (recommended: 7 days)
- [ ] Enable 2FA for admin accounts (optional but recommended)

### 3. **API Security**
- [ ] Use HTTPS only (no HTTP)
- [ ] Implement rate limiting
- [ ] Add request validation
- [ ] Use proper CORS configuration
- [ ] Never expose service role key to frontend

### 4. **Environment Variables**
- [ ] Store all secrets in environment variables
- [ ] Never commit secrets to git
- [ ] Use different keys for dev/staging/production
- [ ] Rotate keys regularly
- [ ] Document which keys are needed where

### 5. **Multi-Tenant Security**
- [ ] Verify company isolation works correctly
- [ ] Test that users can't access other companies' data
- [ ] Ensure all queries filter by company_id
- [ ] Add company_id validation in backend

## 🔧 How RLS Works in Production

### Key Concepts:
1. **Company Isolation**: All data is filtered by `company_id`
2. **Role-Based Access**: Different permissions for admin, developer, lender, buyer, applicant
3. **No Recursion**: Uses SECURITY DEFINER functions to avoid infinite loops
4. **Performance**: Indexed columns for fast lookups

### Security Rules by Table:

| Table | Who Can View | Who Can Create | Who Can Update | Who Can Delete |
|-------|--------------|----------------|----------------|----------------|
| profiles | Own + Same company | Self only | Self only | Nobody |
| companies | Own company | Nobody | Admins only | Nobody |
| applicants | Same company | Same company | Same company | Admins only |
| projects | Everyone | Developers/Admins | Developers/Admins | Admins only |
| activities | Same company | System/Self | Nobody | Nobody |
| contact_submissions | Admins only | Everyone | Nobody | Nobody |
| matches | Related company | System only | System only | Nobody |

## 🚀 Steps to Enable Production Security

### Step 1: Apply RLS Policies
```sql
-- Run in Supabase SQL Editor
-- Use the contents of production_rls_policies.sql
```

### Step 2: Configure Authentication
```javascript
// In supabase_backend.py
auth_response = supabase.auth.sign_up({
    "email": email,
    "password": password,
    "options": {
        "emailRedirectTo": "https://yourdomain.com/auth/confirm"  // Add this
    }
})
```

### Step 3: Update CORS
```python
# In supabase_backend.py
CORS_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com"
    # Remove localhost for production
]
```

### Step 4: Environment Variables
```bash
# Production .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-production-service-key  # Keep SECRET!
SUPABASE_ANON_KEY=your-production-anon-key       # OK for frontend

# Never use development keys in production!
```

## 🧪 Testing Security

### Test Multi-Tenant Isolation:
1. Create 2 companies with different users
2. Try to access Company A's data while logged in as Company B user
3. Should return empty results or access denied

### Test Role Permissions:
1. Login as buyer → Try to create project → Should fail
2. Login as developer → Create project → Should succeed
3. Login as admin → Delete project → Should succeed

### Test Public Access:
1. Without login → View projects → Should work
2. Without login → View applicants → Should fail
3. Without login → Submit contact form → Should work

## 🚨 Security Best Practices

### DO:
- ✅ Always use parameterized queries
- ✅ Validate all user input
- ✅ Use HTTPS everywhere
- ✅ Keep dependencies updated
- ✅ Monitor for suspicious activity
- ✅ Regular security audits
- ✅ Implement proper logging

### DON'T:
- ❌ Expose service role key
- ❌ Store passwords in plain text
- ❌ Trust client-side validation only
- ❌ Use same keys across environments
- ❌ Disable RLS in production
- ❌ Allow unlimited API requests

## 📊 Monitoring & Alerts

Set up monitoring for:
- Failed login attempts
- Unusual data access patterns
- API rate limit violations
- Database connection issues
- Error rates

## 🔑 Key Security Features

1. **Row Level Security (RLS)**
   - Enforces data access at database level
   - Cannot be bypassed by API
   - Works with all queries automatically

2. **Multi-Tenant Isolation**
   - Each company's data is isolated
   - No cross-company data leaks
   - Enforced by RLS policies

3. **Role-Based Access Control (RBAC)**
   - Different permissions per role
   - Enforced in both frontend and backend
   - Backed by database policies

4. **Secure Authentication**
   - Passwords hashed with bcrypt
   - JWT tokens with expiration
   - Session management
   - Email verification available

## 🎯 Final Checklist Before Going Live

- [ ] RLS enabled and tested
- [ ] All environment variables set correctly
- [ ] HTTPS configured
- [ ] CORS restricted to production domains
- [ ] Rate limiting enabled
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Incident response plan ready
- [ ] Security audit completed
- [ ] Documentation updated

## 📞 Emergency Procedures

If you suspect a security breach:
1. Immediately rotate all API keys
2. Review access logs
3. Temporarily disable affected features
4. Notify affected users if necessary
5. Document the incident

Remember: Security is an ongoing process, not a one-time setup!