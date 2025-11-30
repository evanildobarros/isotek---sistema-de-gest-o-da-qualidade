-- =====================================================================
-- COPY THIS ENTIRE FILE AND RUN IT IN SUPABASE SQL EDITOR
-- =====================================================================
-- This will fix: "Could not find a relationship between 'company_info' and 'profiles'"
-- =====================================================================

-- Step 1: Verify tables exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'company_info') THEN
        RAISE EXCEPTION 'Table company_info does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        RAISE EXCEPTION 'Table profiles does not exist';
    END IF;
    
    RAISE NOTICE 'Both tables exist ✓';
END $$;

-- Step 2: Add owner_id column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'company_info' 
        AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE company_info ADD COLUMN owner_id uuid;
        RAISE NOTICE 'Added owner_id column ✓';
    ELSE
        RAISE NOTICE 'owner_id column already exists ✓';
    END IF;
END $$;

-- Step 3: Clean up invalid references
UPDATE company_info
SET owner_id = NULL
WHERE owner_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = company_info.owner_id);

-- Step 4: Drop existing constraint if exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public'
        AND table_name = 'company_info'
        AND constraint_name = 'company_info_owner_id_fkey'
    ) THEN
        ALTER TABLE company_info DROP CONSTRAINT company_info_owner_id_fkey;
        RAISE NOTICE 'Dropped existing constraint';
    END IF;
END $$;

-- Step 5: Create foreign key constraint
ALTER TABLE company_info
ADD CONSTRAINT company_info_owner_id_fkey
FOREIGN KEY (owner_id)
REFERENCES profiles(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Step 6: Create index
DROP INDEX IF EXISTS idx_company_info_owner_id;
CREATE INDEX idx_company_info_owner_id ON company_info(owner_id);

-- Step 7: Add comments
COMMENT ON COLUMN company_info.owner_id IS 'References profiles.id - The primary administrator/owner of this company';
COMMENT ON CONSTRAINT company_info_owner_id_fkey ON company_info IS 'Foreign key to profiles table - enables Supabase joins';

-- Verification
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'company_info'
    AND tc.constraint_name = 'company_info_owner_id_fkey';

SELECT 
    COUNT(*) as total_companies,
    COUNT(owner_id) as companies_with_owner,
    COUNT(*) - COUNT(owner_id) as companies_without_owner
FROM company_info;

SELECT 
    c.id,
    c.name as company_name,
    c.owner_id,
    p.full_name as owner_full_name
FROM company_info c
LEFT JOIN profiles p ON c.owner_id = p.id
LIMIT 5;

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Foreign key relationship created successfully!';
    RAISE NOTICE 'company_info.owner_id -> profiles.id';
    RAISE NOTICE '========================================';
END $$;
