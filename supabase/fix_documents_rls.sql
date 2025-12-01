-- ========================================
-- FIX: Documents RLS & Search
-- ========================================

-- 1. Enable RLS on documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to ensure clean slate
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'documents' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.documents', pol.policyname);
    END LOOP;
END $$;

-- 3. Create READ policy (SELECT)
-- Allows access if:
-- a) User is Super Admin
-- b) Document belongs to user's company
CREATE POLICY "Documents visible to company members"
ON public.documents
FOR SELECT
USING (
    public.is_super_admin() = true
    OR
    company_id = public.get_user_company_id()
);

-- 4. Create WRITE policies (INSERT, UPDATE, DELETE)
-- Standard policies for company members
CREATE POLICY "Users can insert documents for their company"
ON public.documents
FOR INSERT
WITH CHECK (
    company_id = public.get_user_company_id()
);

CREATE POLICY "Users can update documents for their company"
ON public.documents
FOR UPDATE
USING (
    public.is_super_admin() = true OR company_id = public.get_user_company_id()
)
WITH CHECK (
    public.is_super_admin() = true OR company_id = public.get_user_company_id()
);

CREATE POLICY "Users can delete documents for their company"
ON public.documents
FOR DELETE
USING (
    public.is_super_admin() = true OR company_id = public.get_user_company_id()
);

-- 5. Verification
-- Check if policies were created
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'documents';
