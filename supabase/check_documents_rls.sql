-- ========================================
-- INSPECT DOCUMENTS TABLE & RLS
-- ========================================

-- 1. Check if table exists and RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'documents';

-- 2. List columns (to verify title, code, description exist)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'documents';

-- 3. List existing policies
SELECT policyname, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'documents';

-- 4. Test visibility for the user
-- This simulates what the user sees
SELECT count(*) as visible_docs_count
FROM public.documents d
WHERE (
  -- Simulate the policy check if we were using auth.uid()
  -- But since we are in SQL Editor, we can't easily simulate auth.uid() without set_config
  -- So we'll just check if there are ANY documents first
  true
);
