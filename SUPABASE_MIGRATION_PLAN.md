# 🚀 Supabase Migration Plan for HomeVerse

## Why Migrate to Supabase?

### Current Pain Points:
1. PostgreSQL connection issues taking hours to debug
2. Manual database initialization required
3. No built-in auth system (we built our own)
4. Limited visibility into database state
5. Complex deployment configuration

### Supabase Solutions:
1. **Instant Setup** - Database works immediately
2. **Built-in Auth** - Replace our custom JWT system
3. **Database GUI** - See and edit data visually
4. **Better Security** - Row Level Security policies
5. **Real-time** - WebSocket subscriptions included

## Migration Steps

### Phase 1: Setup Supabase (30 minutes)
1. Create Supabase account at https://supabase.com
2. Create new project "homeverse-prod"
3. Save connection details:
   ```
   SUPABASE_URL=https://[PROJECT_ID].supabase.co
   SUPABASE_ANON_KEY=[ANON_KEY]
   SUPABASE_SERVICE_KEY=[SERVICE_KEY]
   DATABASE_URL=[DIRECT_CONNECTION_STRING]
   ```

### Phase 2: Database Schema (1 hour)
```sql
-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO '[YOUR-JWT-SECRET]';

-- Companies table with RLS
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    key TEXT UNIQUE NOT NULL,
    plan TEXT DEFAULT 'trial',
    seats INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Users handled by Supabase Auth
-- Additional user data in profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    company_id UUID REFERENCES companies(id),
    role TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Applicants with automatic company isolation
CREATE TABLE applicants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    income NUMERIC,
    household_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only see their company data" ON applicants
    FOR ALL USING (company_id = auth.jwt()->>'company_id');

CREATE POLICY "Users can only see their company" ON companies
    FOR ALL USING (id = auth.jwt()->>'company_id');
```

### Phase 3: Update Backend (2 hours)

1. **Install Supabase client**:
   ```bash
   pip install supabase
   ```

2. **Replace authentication**:
   ```python
   from supabase import create_client, Client
   
   supabase: Client = create_client(
       os.getenv("SUPABASE_URL"),
       os.getenv("SUPABASE_ANON_KEY")
   )
   
   @app.post("/api/v1/auth/login")
   async def login(email: str, password: str):
       try:
           # Supabase handles password hashing, tokens, etc.
           response = supabase.auth.sign_in_with_password({
               "email": email,
               "password": password
           })
           return {
               "access_token": response.session.access_token,
               "user": response.user
           }
       except Exception as e:
           raise HTTPException(400, str(e))
   ```

3. **Simplified database queries**:
   ```python
   # Before: Complex SQL with connection management
   # After: Simple Supabase client
   
   @app.get("/api/v1/applicants")
   async def get_applicants(token: str = Depends(verify_token)):
       # Supabase automatically filters by company_id from token
       response = supabase.table('applicants').select("*").execute()
       return response.data
   ```

### Phase 4: Frontend Updates (1 hour)

1. **Install Supabase JS client**:
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Update API client**:
   ```typescript
   import { createClient } from '@supabase/supabase-js'
   
   const supabase = createClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   )
   
   // Real-time subscriptions
   supabase
       .channel('applicants')
       .on('postgres_changes', 
           { event: '*', schema: 'public', table: 'applicants' },
           (payload) => {
               console.log('Change received!', payload)
               // Update UI automatically
           }
       )
       .subscribe()
   ```

## Benefits for HomeVerse

### 1. **Instant Multi-tenancy**
- Row Level Security automatically isolates company data
- No manual filtering needed
- Secure by default

### 2. **Built-in Features**
- Authentication (including OAuth providers)
- File storage for documents
- Real-time updates
- Database backups
- Email templates

### 3. **AI-Ready**
- pgvector extension for embeddings
- Edge Functions for matching algorithms
- Direct SQL access for complex queries

### 4. **Developer Experience**
- Visual database editor
- SQL editor with autocomplete
- API logs and monitoring
- One-click rollbacks

## Cost Comparison

### Current (Render):
- PostgreSQL Starter: $7/month
- No auth system included
- No file storage included
- Manual backups

### Supabase:
- Free tier: 500MB database, 1GB storage, 50k MAU
- Pro: $25/month for 8GB database, 100GB storage, 100k MAU
- Includes auth, storage, realtime, backups

## Migration Timeline

- **Day 1**: Set up Supabase, migrate schema
- **Day 2**: Update backend endpoints
- **Day 3**: Update frontend, test
- **Day 4**: Deploy and switch over

## Immediate Next Steps

1. **Keep current SQLite working** for now
2. **Set up Supabase project** in parallel
3. **Migrate incrementally** - start with auth
4. **Test thoroughly** before switching

## SQL Migration Script

```sql
-- Run this in Supabase SQL editor after creating project

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- All your tables here with proper types...

-- Insert test data
INSERT INTO companies (name, key) VALUES ('Demo Company', 'demo-company-2024');

-- Create test users via Supabase Auth UI or API
```

Would you like me to:
1. Create a Supabase-ready version of the backend?
2. Generate the complete SQL migration script?
3. Create a parallel branch for testing Supabase?

The migration would solve our current issues and provide a much more robust foundation for production.