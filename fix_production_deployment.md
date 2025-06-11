# Fix Production Deployment Issues

## 🚨 Current Issue
The production backend is running `simple_backend.py` (SQLite) instead of `supabase_backend.py` (Supabase), causing authentication failures.

## 🔧 Immediate Fix

### 1. Update render.yaml to ensure correct backend
The render.yaml is already correct, but we need to ensure it's being used.

### 2. Create explicit start script
Create a `start.sh` file to ensure the correct backend runs:

```bash
#!/bin/bash
echo "Starting HomeVerse Supabase Backend..."
python supabase_backend.py
```

### 3. Update render.yaml to use the script
```yaml
startCommand: "chmod +x start.sh && ./start.sh"
```

### 4. Ensure Supabase environment variables are set in Render

Required environment variables for `homeverse-api` service on Render:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key  
- `SUPABASE_ANON_KEY`: Your Supabase anon key
- `SENDGRID_API_KEY`: Already set
- `CORS_ORIGINS`: Already set to "*"

### 5. Verify frontend is using Supabase directly
The frontend should connect to Supabase, not the backend API for auth.

## 📋 Deployment Steps

1. **Create start script**
2. **Commit and push changes**
3. **Monitor Render deployment**
4. **Verify correct backend is running**

## 🧪 Verification

After deployment, check:
```bash
curl https://homeverse-api.onrender.com/
# Should show: "HomeVerse API v2.0 - Powered by Supabase"
```

## 🚦 Alternative: Direct Supabase Frontend

Since the frontend is already configured to use Supabase directly, consider:
1. Frontend connects directly to Supabase for auth/data
2. Backend only handles special operations (email, file processing)
3. This would bypass CORS issues entirely