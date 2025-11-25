-- Remove the problematic Foreign Key constraint
ALTER TABLE public.company_info DROP CONSTRAINT IF EXISTS company_info_owner_id_fkey;

-- Verify if there are any other constraints on owner_id
-- (Optional, just to be clean)
