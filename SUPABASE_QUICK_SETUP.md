# 🚀 Quick Supabase Setup

## 1. Create .env File

Create a `.env` file in the root directory with your Supabase credentials:
```bash
# Copy the example file
cp .env.example .env

# Edit it with your credentials
# Get these from: https://vzxadsifonqklotzhdpl.supabase.co/project/vzxadsifonqklotzhdpl/settings/api
SUPABASE_URL=https://vzxadsifonqklotzhdpl.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here
SUPABASE_ANON_KEY=your_anon_key_here
```

## 2. Run Database Schema

1. Go to: https://vzxadsifonqklotzhdpl.supabase.co/project/vzxadsifonqklotzhdpl/sql/new
2. Copy all content from `supabase_schema.sql`
3. Paste it in the SQL editor
4. Click "Run" (bottom right)
5. You should see "Success" messages for all tables

## 3. Create Test Users

### Option A: Python Script (Recommended)
```bash
# Install dependencies
pip install supabase python-dotenv

# Run the script (it will read from .env)
python3 create_supabase_test_users.py
```

### Option B: Manual via Dashboard
Go to: https://vzxadsifonqklotzhdpl.supabase.co/project/vzxadsifonqklotzhdpl/auth/users
Click "Add user" and create:
- developer@test.com / password123
- lender@test.com / password123
- buyer@test.com / password123
- applicant@test.com / password123
- admin@test.com / password123

## 3. Test Locally

```bash
# Terminal 1: Start Supabase backend
python3 supabase_backend.py

# Terminal 2: Start frontend
cd frontend
npm install @supabase/supabase-js
npm run dev
```

## 4. Environment Variables for Production

### Backend (Render)
```
SUPABASE_URL=https://vzxadsifonqklotzhdpl.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eGFkc2lmb25xa2xvdHpoZHBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTUwNDQ1MCwiZXhwIjoyMDY1MDgwNDUwfQ.gXduNJebu3W2X1jCYMruxHV5Yq-IOkZ4eGN9gMBAUJ4
```

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://vzxadsifonqklotzhdpl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eGFkc2lmb25xa2xvdHpoZHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MDQ0NTAsImV4cCI6MjA2NTA4MDQ1MH0.ZY31NHg6qamLBVeHT5Lo-ud0K_ayPh8DRamK5AUJ6t4
```

## Direct Links to Your Project

- **SQL Editor**: https://vzxadsifonqklotzhdpl.supabase.co/project/vzxadsifonqklotzhdpl/sql/new
- **Table Editor**: https://vzxadsifonqklotzhdpl.supabase.co/project/vzxadsifonqklotzhdpl/editor
- **Auth Users**: https://vzxadsifonqklotzhdpl.supabase.co/project/vzxadsifonqklotzhdpl/auth/users
- **API Docs**: https://vzxadsifonqklotzhdpl.supabase.co/project/vzxadsifonqklotzhdpl/api

## Test the Setup

Once schema is created and users are added:
1. Visit http://localhost:3000
2. Login with developer@test.com / password123
3. You should see the developer dashboard!

## Troubleshooting

If you get errors:
1. Check the Table Editor to ensure all tables were created
2. Check Auth → Users to ensure test users exist
3. Check that profiles table has entries for each user