# Quick Fix Guide for Supabase Entity Creation

## 🚨 Problem
Users can't create entities (applicants, projects) because their profiles don't have `company_id` assigned.

## ✅ Quick Solution (3 Steps)

### Step 1: Run SQL Fix in Supabase
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `fix_supabase_minimal.sql`
3. Click "Run"

This will:
- Create a default company
- Fix existing profiles
- Update RLS policies

### Step 2: Apply Backend Patch
```bash
# Generate the patched backend
python3 patch_supabase_backend.py

# Review changes (optional)
diff supabase_backend.py supabase_backend_patched.py

# Apply the patch
cp supabase_backend_patched.py supabase_backend.py

# Restart backend
python3 supabase_backend.py
```

### Step 3: Test It Works
```bash
# Run the test script
python3 test_supabase_entity_creation.py
```

## 🔍 What These Fixes Do

1. **SQL Fix**:
   - Creates a "Default Company" for user assignment
   - Updates all profiles without company_id
   - Simplifies RLS policies to avoid recursion
   - Adds debug function to check user status

2. **Backend Patch**:
   - Auto-creates/fixes profiles when users log in
   - Ensures every user has a company_id
   - Adds profile status endpoints

## 🧪 Testing Individual Users

In Supabase SQL Editor, check any user's status:
```sql
SELECT * FROM check_user_profile('developer@test.com');
```

This shows:
- If they have a profile
- Their company assignment
- What entities they can create

## 🚀 Result
After applying these fixes:
- ✅ All users can create applicants
- ✅ Developers/admins can create projects
- ✅ No more "permission denied" errors
- ✅ Multi-tenant isolation maintained