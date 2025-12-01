-- ========================================
-- DEBUG SEARCH & DATA VISIBILITY
-- ========================================

-- 1. Get User Info (ID and Company)
WITH user_info AS (
    SELECT u.id, u.email, p.company_id, p.is_super_admin
    FROM auth.users u
    JOIN public.profiles p ON u.id = p.id
    WHERE u.email = 'evanildobarros@gmail.com'
)
SELECT 
    'User Info' as check_type,
    email, 
    company_id, 
    is_super_admin 
FROM user_info;

-- 2. List ALL Documents (Bypassing RLS for debug)
-- We want to see what exists in the DB, regardless of permissions
-- Note: In SQL Editor, RLS is active if we don't use a superuser role, 
-- but usually the editor runs as postgres (superuser).
SELECT 
    'Document Data' as check_type,
    id, 
    title, 
    code, 
    company_id,
    CASE 
        WHEN company_id = (SELECT company_id FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'evanildobarros@gmail.com')) THEN 'MATCH'
        ELSE 'MISMATCH'
    END as company_match
FROM public.documents;

-- 3. Test the Search Query Logic
-- Simulating the query used in Header.tsx
SELECT 
    'Search Test' as check_type,
    id, 
    title
FROM public.documents
WHERE 
    title ILIKE '%política%' 
    OR code ILIKE '%política%';
