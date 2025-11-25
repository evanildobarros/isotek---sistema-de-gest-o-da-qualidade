-- MASTER SECURITY SCRIPT
-- This script secures all major tables by adding company_id and enforcing RLS.

-- =============================================================================
-- 1. DOCUMENTS
-- =============================================================================
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.company_info(id);

-- Backfill
UPDATE public.documents d
SET company_id = p.company_id
FROM public.profiles p
WHERE d.owner_id = p.id
AND d.company_id IS NULL;

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own company documents" ON public.documents;
CREATE POLICY "Users can view own company documents" ON public.documents
FOR SELECT USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR (auth.jwt() ->> 'email' = 'evanildobarros@gmail.com')
);

DROP POLICY IF EXISTS "Users can insert own company documents" ON public.documents;
CREATE POLICY "Users can insert own company documents" ON public.documents
FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own company documents" ON public.documents;
CREATE POLICY "Users can update own company documents" ON public.documents
FOR UPDATE USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own company documents" ON public.documents;
CREATE POLICY "Users can delete own company documents" ON public.documents
FOR DELETE USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);


-- =============================================================================
-- 2. AUDITS
-- =============================================================================
ALTER TABLE public.audits ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.company_info(id);

-- Backfill
UPDATE public.audits a
SET company_id = p.company_id
FROM public.profiles p
WHERE a.created_by = p.id
AND a.company_id IS NULL;

-- Enable RLS
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own company audits" ON public.audits;
CREATE POLICY "Users can view own company audits" ON public.audits
FOR SELECT USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR (auth.jwt() ->> 'email' = 'evanildobarros@gmail.com')
);

DROP POLICY IF EXISTS "Users can insert own company audits" ON public.audits;
CREATE POLICY "Users can insert own company audits" ON public.audits
FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own company audits" ON public.audits;
CREATE POLICY "Users can update own company audits" ON public.audits
FOR UPDATE USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own company audits" ON public.audits;
CREATE POLICY "Users can delete own company audits" ON public.audits
FOR DELETE USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);


-- =============================================================================
-- 3. NON CONFORMITIES (RNC)
-- =============================================================================
ALTER TABLE public.non_conformities ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.company_info(id);

-- Backfill
UPDATE public.non_conformities n
SET company_id = p.company_id
FROM public.profiles p
WHERE n.responsible_id = p.id
AND n.company_id IS NULL;

-- Enable RLS
ALTER TABLE public.non_conformities ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own company RNCs" ON public.non_conformities;
CREATE POLICY "Users can view own company RNCs" ON public.non_conformities
FOR SELECT USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR (auth.jwt() ->> 'email' = 'evanildobarros@gmail.com')
);

DROP POLICY IF EXISTS "Users can insert own company RNCs" ON public.non_conformities;
CREATE POLICY "Users can insert own company RNCs" ON public.non_conformities
FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own company RNCs" ON public.non_conformities;
CREATE POLICY "Users can update own company RNCs" ON public.non_conformities
FOR UPDATE USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own company RNCs" ON public.non_conformities;
CREATE POLICY "Users can delete own company RNCs" ON public.non_conformities
FOR DELETE USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);


-- =============================================================================
-- 4. CORRECTIVE ACTIONS
-- =============================================================================
ALTER TABLE public.corrective_actions ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.company_info(id);

-- Backfill
UPDATE public.corrective_actions c
SET company_id = p.company_id
FROM public.profiles p
WHERE c.owner_id = p.id
AND c.company_id IS NULL;

-- Enable RLS
ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own company actions" ON public.corrective_actions;
CREATE POLICY "Users can view own company actions" ON public.corrective_actions
FOR SELECT USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR (auth.jwt() ->> 'email' = 'evanildobarros@gmail.com')
);

DROP POLICY IF EXISTS "Users can insert own company actions" ON public.corrective_actions;
CREATE POLICY "Users can insert own company actions" ON public.corrective_actions
FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own company actions" ON public.corrective_actions;
CREATE POLICY "Users can update own company actions" ON public.corrective_actions
FOR UPDATE USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own company actions" ON public.corrective_actions;
CREATE POLICY "Users can delete own company actions" ON public.corrective_actions
FOR DELETE USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);
