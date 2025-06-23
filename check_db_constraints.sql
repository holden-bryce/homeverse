-- Check constraints on investments table
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'investments'::regclass
AND contype = 'c';

-- Also check column info
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'investments'
ORDER BY ordinal_position;