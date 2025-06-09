# 🚀 Supabase Quick Setup Guide

## Step 1: Create Your Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Create a new project:
   - **Project name**: homeverse-prod
   - **Database Password**: [Generate a strong one and save it!]
   - **Region**: Choose closest to your users
   - **Plan**: Free tier to start

## Step 2: Save Your Credentials

Once created, go to Settings → API and copy these:

```env
# Add to .env.local for frontend
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]

# Add to render.yaml for backend
SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
SUPABASE_SERVICE_KEY=[YOUR-SERVICE-KEY]  # Settings → API → service_role key
DATABASE_URL=[YOUR-DATABASE-URL]  # Settings → Database → Connection string
```

## Step 3: Initial Database Setup

Go to SQL Editor in Supabase dashboard and run this:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial schema
-- Copy from supabase_schema.sql file I'm creating
```

## Step 4: Create Test Users

Go to Authentication → Users and create:
- developer@test.com / password123
- lender@test.com / password123
- buyer@test.com / password123
- applicant@test.com / password123
- admin@test.com / password123

Or use the SQL script I'll provide.

## That's it! 🎉

Your database is ready. Now we just need to update the code to use it.