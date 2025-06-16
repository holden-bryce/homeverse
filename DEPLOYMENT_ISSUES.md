# Deployment Issues & Solutions

## Current Status

### ✅ Working
- Frontend deployed and accessible
- Login page loads correctly
- CORS properly configured for frontend URL

### ❌ Not Working
- Backend database connection failing
- Error: "Project not specified" from Supabase

## Root Cause

The error `"Project not specified"` indicates that the Supabase environment variables are not set correctly in Render.

## Required Environment Variables

Make sure these are set in your Render backend service (homeverse-api):

```bash
# CRITICAL - These must be set correctly
SUPABASE_URL=https://vzxadsifonqklotzhdpl.supabase.co
SUPABASE_SERVICE_KEY=<your-service-role-key-from-supabase>
SUPABASE_ANON_KEY=<your-anon-key-from-supabase>

# Also needed
CORS_ORIGINS=https://homeverse-frontend.onrender.com,http://localhost:3000
SENDGRID_API_KEY=<your-sendgrid-key>
OPENAI_API_KEY=<your-openai-key>
PYTHONPATH=.
```

## How to Fix

1. **Go to Render Dashboard**
   - Navigate to your backend service (homeverse-api)
   - Click on "Environment" tab

2. **Get Supabase Keys**
   - Go to your Supabase project dashboard
   - Settings → API
   - Copy:
     - Project URL
     - `anon` public key
     - `service_role` secret key (keep this secure!)

3. **Update Environment Variables**
   - Add/update all variables listed above
   - Make sure there are no extra quotes or spaces
   - Save changes

4. **Trigger Redeploy**
   - Click "Manual Deploy" → "Deploy latest commit"
   - Or push a small change to trigger auto-deploy

## Verification Steps

After fixing, test again:

```bash
# Test backend health
curl https://homeverse-api.onrender.com/health

# Should return:
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "..."
}
```

## Local vs Deployed Differences

| Feature | Local | Deployed | Status |
|---------|-------|----------|--------|
| Frontend | ✅ Working | ✅ Working | ✅ |
| Backend API | ✅ Working | ❌ DB Error | 🔧 |
| Authentication | ✅ Working | ❌ Blocked | 🔧 |
| CRUD Operations | ✅ Working | ❌ Blocked | 🔧 |
| Data Isolation | ✅ Working | ❌ Blocked | 🔧 |

Once the environment variables are fixed, all functionality should match local behavior.