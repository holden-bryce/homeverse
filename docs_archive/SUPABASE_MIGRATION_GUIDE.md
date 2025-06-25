# 🚀 Complete Supabase Migration Guide

## Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub or email
4. Create new project:
   - **Name**: homeverse-prod
   - **Password**: [Generate strong password and save it]
   - **Region**: Choose closest to users

## Step 2: Get Your Credentials

After project creation, go to Settings → API and copy:

```bash
# Backend environment variables (add to Render)
SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
SUPABASE_SERVICE_KEY=[YOUR-SERVICE-KEY]  # Settings → API → service_role
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]       # Settings → API → anon

# Frontend environment variables (add to .env.local)
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

## Step 3: Set Up Database Schema

1. Go to SQL Editor in Supabase dashboard
2. Copy all content from `supabase_schema.sql`
3. Paste and run it
4. You should see "Success" messages for all tables

## Step 4: Create Test Users

### Option A: Using Supabase Dashboard (Easier)
1. Go to Authentication → Users
2. Click "Add user" → "Create new user"
3. Create each user with:
   - Email: developer@test.com (etc.)
   - Password: password123
   - Auto confirm email: ✓

### Option B: Using Python Script
```bash
# Set environment variables first
export SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
export SUPABASE_SERVICE_KEY=[YOUR-SERVICE-KEY]

# Install Supabase Python client
pip install supabase

# Run the script
python3 create_supabase_test_users.py
```

## Step 5: Update Backend

### Local Testing with Supabase Backend

```bash
# Install dependencies
pip install -r requirements_supabase.txt

# Set environment variables
export SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
export SUPABASE_SERVICE_KEY=[YOUR-SERVICE-KEY]

# Run the Supabase backend
python3 supabase_backend.py
```

### Deploy to Render

1. Update your `render.yaml`:
```yaml
services:
  - type: web
    name: homeverse-api
    env: python
    buildCommand: "pip install -r requirements_supabase.txt"
    startCommand: "python supabase_backend.py"
    envVars:
      - key: SUPABASE_URL
        value: YOUR_SUPABASE_URL
      - key: SUPABASE_SERVICE_KEY
        value: YOUR_SERVICE_KEY
```

2. Commit and push:
```bash
git add supabase_backend.py requirements_supabase.txt
git commit -m "Add Supabase backend integration"
git push origin main
```

## Step 6: Update Frontend

1. Install Supabase client:
```bash
cd frontend
npm install @supabase/supabase-js
```

2. Update `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

3. Update API client to use Supabase (already created in `frontend/src/lib/supabase.ts`)

4. Update auth provider (already created in `frontend/src/providers/supabase-auth-provider.tsx`)

## Step 7: Test Everything

1. **Test Authentication**:
   - Go to http://localhost:3000
   - Try logging in with developer@test.com / password123
   - Should redirect to developer dashboard

2. **Test Database Operations**:
   - Create an applicant
   - View applicants list
   - Edit applicant
   - All should work with Supabase

3. **Test Real-time** (bonus):
   - Open two browser windows
   - Create applicant in one
   - Should appear in other window instantly

## Step 8: Production Deployment

1. Update Render environment variables
2. Update frontend environment variables
3. Deploy both services
4. Test with production URLs

## Migration Benefits

### Before (PostgreSQL/SQLite):
- ❌ Complex database setup
- ❌ Manual user management
- ❌ No built-in auth
- ❌ No real-time features
- ❌ Limited storage options

### After (Supabase):
- ✅ Instant database setup
- ✅ Built-in auth with OAuth
- ✅ Real-time subscriptions
- ✅ File storage included
- ✅ Row Level Security
- ✅ Database GUI
- ✅ Automatic backups

## Troubleshooting

### "Invalid API key"
- Make sure you're using service_key for backend, anon_key for frontend

### "User not found"
- Ensure test users are created
- Check that profiles table has entries

### "Permission denied"
- Check RLS policies are set up
- Verify user has correct company_id

### "Connection refused"
- Check Supabase URL is correct
- Ensure project is not paused (free tier pauses after 1 week inactive)

## Next Steps

1. **Enable OAuth providers** (Google, GitHub) in Authentication settings
2. **Set up email templates** for welcome emails, password resets
3. **Configure storage buckets** for different file types
4. **Add database indexes** for performance
5. **Set up database backups** and point-in-time recovery

## Rollback Plan

If you need to rollback:
1. Keep `simple_backend.py` as backup
2. Switch back by changing startCommand in render.yaml
3. All data is preserved in both systems

That's it! Your application is now powered by Supabase 🎉