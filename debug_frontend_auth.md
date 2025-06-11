# Debug Frontend Authentication Issues

## 🔍 Current Symptoms
1. Sidebar not populating in production
2. Profile shows as null despite login attempt
3. Console shows "SignIn called with: admin@test.com"
4. Backend is up but wrong version deployed

## 🐛 Root Causes

### 1. Backend Mismatch
- **Expected**: `supabase_backend.py` (uses Supabase auth)
- **Actual**: `simple_backend.py` (uses JWT auth)
- **Result**: Frontend tries Supabase auth, backend expects JWT

### 2. Authentication Flow Confusion
The frontend is configured for Supabase auth but the production backend is running the old JWT-based system.

## 🔧 Quick Fixes

### Option 1: Fix Backend Deployment (Recommended)
1. Push the render.yaml changes to deploy correct backend
2. Ensure Supabase env vars are set in Render

### Option 2: Temporary Frontend Fix
While waiting for backend fix, update frontend to use old API:

```typescript
// In frontend/src/lib/api/client.ts
// Temporarily use the old auth flow
const API_URL = 'https://homeverse-api.onrender.com'

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  
  if (!response.ok) throw new Error('Login failed')
  
  const data = await response.json()
  // Store JWT token
  localStorage.setItem('token', data.access_token)
  return data
}
```

## 📊 Debug Steps

1. **Check Browser Console**
   - Look for CORS errors
   - Check network tab for failed requests
   - Verify Supabase is initialized

2. **Test Supabase Connection**
   ```javascript
   // Run in browser console
   console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
   console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
   ```

3. **Check Auth State**
   ```javascript
   // Run in browser console after login attempt
   const { data: { session } } = await supabase.auth.getSession()
   console.log('Session:', session)
   ```

## 🚀 Permanent Solution

1. **Deploy Correct Backend**
   - Ensure `supabase_backend.py` is running
   - Set all Supabase env vars in Render

2. **Verify Frontend Config**
   - Ensure `.env.production` has correct Supabase URLs
   - Remove any legacy API URL usage

3. **Test Full Flow**
   - Login with test credentials
   - Verify profile loads with company_id
   - Check sidebar populates

## 📝 Monitoring

After fix is deployed:
```bash
# Check correct backend is running
curl https://homeverse-api.onrender.com/
# Should show: "HomeVerse API v2.0 - Powered by Supabase"

# Test auth endpoint
curl -X POST https://homeverse-api.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'
```