-- 1. Add company_id column
ALTER TABLE public.swot_analysis ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.company_info(id);

-- 2. Backfill company_id from profiles (assuming user_id matches profile id)
UPDATE public.swot_analysis s
SET company_id = p.company_id
FROM public.profiles p
WHERE s.user_id = p.id
AND s.company_id IS NULL;

-- 3. Enable RLS
ALTER TABLE public.swot_analysis ENABLE ROW LEVEL SECURITY;

-- 4. Create Policy for Isolation
DROP POLICY IF EXISTS "Users can view own company swot" ON public.swot_analysis;
CREATE POLICY "Users can view own company swot" ON public.swot_analysis
FOR SELECT
TO authenticated
USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR
    (auth.jwt() ->> 'email' = 'evanildobarros@gmail.com') -- Super Admin fallback
);

DROP POLICY IF EXISTS "Users can insert own company swot" ON public.swot_analysis;
CREATE POLICY "Users can insert own company swot" ON public.swot_analysis
FOR INSERT
TO authenticated
WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own company swot" ON public.swot_analysis;
CREATE POLICY "Users can update own company swot" ON public.swot_analysis
FOR UPDATE
TO authenticated
USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own company swot" ON public.swot_analysis;
CREATE POLICY "Users can delete own company swot" ON public.swot_analysis
FOR DELETE
TO authenticated
USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);
