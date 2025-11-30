-- =====================================================================
-- Verification Script: Check Foreign Key Relationship
-- =====================================================================
-- Run this AFTER applying fix_company_profiles_relationship.sql
-- to verify that the relationship was created successfully
-- =====================================================================

-- 1. Check if the foreign key constraint exists
SELECT 
    '✓ Foreign Key Constraint' as check_type,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'company_info'
    AND tc.constraint_name = 'company_info_owner_id_fkey';

-- 2. Check if the index exists
SELECT 
    '✓ Performance Index' as check_type,
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE tablename = 'company_info'
    AND indexname = 'idx_company_info_owner_id';

-- 3. Test the join (same as Supabase will use)
SELECT 
    '✓ Join Test' as check_type,
    c.id as company_id,
    c.name as company_name,
    c.owner_id,
    p.id as profile_id,
    p.full_name as owner_full_name
FROM company_info c
LEFT JOIN profiles p ON c.owner_id = p.id
LIMIT 5;

-- 4. Statistics
SELECT 
    '✓ Statistics' as check_type,
    COUNT(*) as total_companies,
    COUNT(owner_id) as companies_with_owner,
    COUNT(*) - COUNT(owner_id) as companies_without_owner,
    ROUND(100.0 * COUNT(owner_id) / NULLIF(COUNT(*), 0), 2) as percentage_with_owner
FROM company_info;

-- 5. Check for orphaned owner_id references (should be 0)
SELECT 
    '✓ Data Integrity Check' as check_type,
    COUNT(*) as orphaned_references,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS - No orphaned references'
        ELSE 'FAIL - Found orphaned references'
    END as status
FROM company_info c
WHERE c.owner_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = c.owner_id);

-- =====================================================================
-- If all checks pass, the relationship is properly configured!
-- =====================================================================
