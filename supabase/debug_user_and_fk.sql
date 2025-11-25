-- Check if the specific user exists in auth.users (requires admin privileges, run in SQL Editor)
SELECT id, email, created_at FROM auth.users WHERE id = '68d3b42c-e6da-4c58-a31c-2fff15b484eb';

-- Check the constraint definition again
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table_name
FROM
    pg_constraint
WHERE
    conname = 'company_info_owner_id_fkey';
