# 🚀 Quick User Setup - Do This Now!

## Option 1: Supabase Dashboard (Easiest - 2 minutes)

1. **Go to Users Page**: https://vzxadsifonqklotzhdpl.supabase.co/project/vzxadsifonqklotzhdpl/auth/users

2. **Click "Add user" → "Create new user"** and create these 5 users:
   - Email: `developer@test.com`, Password: `password123`
   - Email: `lender@test.com`, Password: `password123`
   - Email: `buyer@test.com`, Password: `password123`
   - Email: `applicant@test.com`, Password: `password123`
   - Email: `admin@test.com`, Password: `password123`

   **IMPORTANT**: Check ✅ "Auto Confirm Email" for each user!

3. **After creating all 5 users**, go to SQL Editor: https://vzxadsifonqklotzhdpl.supabase.co/project/vzxadsifonqklotzhdpl/sql/new

4. **Run this SQL** to set up their profiles:

```sql
-- Get company ID
DO $$
DECLARE
    cid UUID;
    uid UUID;
BEGIN
    -- Get demo company ID
    SELECT id INTO cid FROM companies WHERE key = 'demo-company-2024';
    
    -- Update developer profile
    SELECT id INTO uid FROM auth.users WHERE email = 'developer@test.com';
    INSERT INTO profiles (id, company_id, role, full_name) 
    VALUES (uid, cid, 'developer', 'Demo Developer')
    ON CONFLICT (id) DO UPDATE SET company_id = cid, role = 'developer', full_name = 'Demo Developer';
    
    -- Update lender profile
    SELECT id INTO uid FROM auth.users WHERE email = 'lender@test.com';
    INSERT INTO profiles (id, company_id, role, full_name) 
    VALUES (uid, cid, 'lender', 'Demo Lender')
    ON CONFLICT (id) DO UPDATE SET company_id = cid, role = 'lender', full_name = 'Demo Lender';
    
    -- Update buyer profile
    SELECT id INTO uid FROM auth.users WHERE email = 'buyer@test.com';
    INSERT INTO profiles (id, company_id, role, full_name) 
    VALUES (uid, cid, 'buyer', 'Demo Buyer')
    ON CONFLICT (id) DO UPDATE SET company_id = cid, role = 'buyer', full_name = 'Demo Buyer';
    
    -- Update applicant profile
    SELECT id INTO uid FROM auth.users WHERE email = 'applicant@test.com';
    INSERT INTO profiles (id, company_id, role, full_name) 
    VALUES (uid, cid, 'applicant', 'Demo Applicant')
    ON CONFLICT (id) DO UPDATE SET company_id = cid, role = 'applicant', full_name = 'Demo Applicant';
    
    -- Update admin profile
    SELECT id INTO uid FROM auth.users WHERE email = 'admin@test.com';
    INSERT INTO profiles (id, company_id, role, full_name) 
    VALUES (uid, cid, 'admin', 'Demo Admin')
    ON CONFLICT (id) DO UPDATE SET company_id = cid, role = 'admin', full_name = 'Demo Admin';
    
    RAISE NOTICE '✅ All profiles updated!';
END $$;
```

## Option 2: Using Python Script

If you prefer automation:

```bash
pip install supabase
python3 quick_create_users.py
# Enter your service key when prompted
```

## That's it! 

Once users are created, you can login at https://homeverse-frontend.onrender.com with:
- developer@test.com / password123
- lender@test.com / password123
- buyer@test.com / password123
- applicant@test.com / password123
- admin@test.com / password123