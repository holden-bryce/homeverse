# Required Environment Variables for Frontend

## For Local Development (.env.local)

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://vzxadsifonqklotzhdpl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Mapbox for maps (REQUIRED for map features)
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# Optional - Only if you want email features
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

## For Production (Render Dashboard)

Add these environment variables in Render:

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://vzxadsifonqklotzhdpl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Mapbox (REQUIRED)
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# Optional
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

## What Each Does

1. **NEXT_PUBLIC_SUPABASE_URL** - Your Supabase project URL (you already have this)
2. **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Public anonymous key from Supabase (safe to expose)
3. **NEXT_PUBLIC_MAPBOX_TOKEN** - For the map visualization features
4. **SENDGRID_API_KEY** - Only needed if you want email notifications to work

## NOT NEEDED

❌ **SUPABASE_SERVICE_ROLE_KEY** - Do NOT add this to frontend
❌ **DATABASE_URL** - Not needed (Supabase handles this)
❌ **REDIS_URL** - Not needed (no backend)
❌ **JWT_SECRET_KEY** - Not needed (Supabase handles auth)
❌ **OPENAI_API_KEY** - Not needed unless you add AI features

## Backend Status

**The Python backend (`supabase_backend.py`) is completely REMOVED and NOT USED.**

Everything now runs through:
- Next.js Server Components (for data fetching)
- Server Actions (for mutations like creating applicants)
- Supabase (for database and authentication)

No separate backend server is running or needed!