-- Check if applications table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'applications'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'applications';

-- Check RLS policies
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'applications';

-- Check if the view exists
SELECT * FROM information_schema.views 
WHERE table_name = 'applications_with_details';

-- Test query to see if we can fetch applications
SELECT COUNT(*) as total_applications FROM applications;