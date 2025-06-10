-- Quick SQL to create admin user after you've created it in Auth
-- 
-- STEP 1: Go to https://vzxadsifonqklotzhdpl.supabase.co/project/vzxadsifonqklotzhdpl/auth/users
-- STEP 2: Click "Add user" → "Create new user"
-- STEP 3: Enter:
--   Email: admin@test.com
--   Password: password123
--   ✅ Auto Confirm Email: CHECKED
-- STEP 4: Click "Create user"
-- STEP 5: Run this SQL in SQL Editor

DO $$
DECLARE
    admin_user_id UUID;
    demo_company_id UUID;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@test.com';
    
    IF admin_user_id IS NULL THEN
        RAISE NOTICE '❌ Admin user not found! Create admin@test.com in Auth dashboard first!';
        RETURN;
    END IF;
    
    -- Get demo company ID
    SELECT id INTO demo_company_id FROM companies WHERE key = 'demo-company-2024';
    
    -- Create/update admin profile
    INSERT INTO profiles (id, company_id, role, full_name)
    VALUES (admin_user_id, demo_company_id, 'admin', 'Demo Admin')
    ON CONFLICT (id) DO UPDATE SET 
        company_id = demo_company_id,
        role = 'admin',
        full_name = 'Demo Admin';
    
    RAISE NOTICE '✅ Admin profile created/updated successfully!';
    RAISE NOTICE 'You can now login with: admin@test.com / password123';
END $$;