# 🚨 HomeVerse Operations Quick Reference
**For:** DevOps & Support Teams  
**Updated:** June 27, 2025

## What Changed in This Deployment

### 🔒 Security Updates
1. **Next.js 14.2.5 → 14.2.30** (security patch)
2. **Rate limiting added** (may block excessive requests)
3. **PII now encrypted** (emails/phones in database)
4. **CORS restricted** (only approved domains)
5. **Service key removed** from frontend

---

## 🚦 Monitoring Alerts

### Rate Limit Monitoring
```bash
# Users hitting rate limits
grep "429" /var/log/homeverse/access.log | wc -l

# Common endpoints being limited
grep "rate_limit_exceeded" /var/log/homeverse/app.log
```

**Normal Limits:**
- Login: 5 attempts/minute
- Registration: 3/hour
- File uploads: 20/hour
- API calls: 1000/hour

### If Users Report "Too Many Requests"
1. Check if legitimate user
2. Review their usage pattern
3. Consider temporary whitelist if needed
4. Contact dev team for limit adjustment

---

## 🔧 Common Issues & Fixes

### Issue: "Cannot search by email"
**Cause:** Emails are now encrypted  
**Fix:** Search by name instead  
**Status:** Working as designed

### Issue: "Login from new domain blocked"
**Cause:** CORS restriction  
**Fix:** Add domain to CORS_ORIGINS_PROD  
```python
# In supabase_backend.py
CORS_ORIGINS_PROD = [
    "https://homeverse-frontend.onrender.com",
    "https://homeverse.com",
    "https://new-domain.com"  # Add here
]
```

### Issue: "File upload fails after 20 files"
**Cause:** Rate limit (20/hour)  
**Fix:** Wait 1 hour or contact admin  

### Issue: "Cannot decrypt applicant data"
**Cause:** Missing encryption key  
**Fix:** Ensure ENCRYPTION_KEY env var is set  

---

## 📞 Escalation Path

### Level 1: Operations Team
- Monitor logs
- Check rate limits
- Verify services running
- Basic troubleshooting

### Level 2: Development Team
- Code changes required
- Rate limit adjustments
- Encryption issues
- Performance problems

### Level 3: Security Team
- Suspicious activity
- Potential breaches
- Authentication issues
- Compliance concerns

---

## 🛠️ Quick Commands

### Health Checks
```bash
# Backend health
curl https://homeverse-api.onrender.com/health

# Frontend health
curl https://homeverse-frontend.onrender.com

# Database connection
curl https://homeverse-api.onrender.com/api/v1/health/db
```

### View Logs
```bash
# Application logs
tail -f /var/log/homeverse/app.log

# Rate limit logs
grep "rate_limit" /var/log/homeverse/app.log

# Error logs
grep "ERROR" /var/log/homeverse/app.log
```

### Emergency Controls
```bash
# Disable rate limiting (TEMPORARY)
# Set env var: DISABLE_RATE_LIMIT=true

# Increase rate limits
# Edit @limiter.limit decorators in code

# Disable encryption (EMERGENCY ONLY)
# Set env var: ENCRYPTION_KEY=""
```

---

## 📊 Performance Baselines

**Normal Response Times:**
- API calls: 150-200ms
- Login: 180-250ms
- File upload: 500-1000ms
- Search: 300-500ms

**Alert if:**
- API > 1000ms consistently
- Login > 2000ms
- Error rate > 5%
- 500 errors > 10/minute

---

## 🔐 Security Checklist

Daily:
- [ ] Check failed login attempts
- [ ] Review rate limit hits
- [ ] Monitor 4xx/5xx errors
- [ ] Check for unusual patterns

Weekly:
- [ ] Review user access logs
- [ ] Check encryption errors
- [ ] Audit new user registrations
- [ ] Review file upload logs

---

## 📝 Change Log

### Version 2.1.0 (Current)
- Added rate limiting
- Implemented PII encryption
- Updated Next.js
- Restricted CORS
- Removed service role key

### Previous: 2.0.0
- Basic functionality
- No rate limits
- Plain text PII
- Open CORS

---

**Keep this reference handy during the first week after deployment!**