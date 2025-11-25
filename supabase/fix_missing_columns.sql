-- Fix missing created_at column in company_info
ALTER TABLE public.company_info
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Re-run the RPC creation just in case it failed due to missing column
CREATE OR REPLACE FUNCTION public.get_all_companies()
RETURNS SETOF public.company_info
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_caller_is_admin boolean;
BEGIN
    -- Security Check
    SELECT (is_super_admin IS TRUE OR auth.jwt() ->> 'email' = 'evanildobarros@gmail.com')
    INTO v_caller_is_admin
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_caller_is_admin IS NULL THEN
        v_caller_is_admin := (auth.jwt() ->> 'email' = 'evanildobarros@gmail.com');
    END IF;

    IF v_caller_is_admin IS NOT TRUE THEN
        RAISE EXCEPTION 'Acesso Negado';
    END IF;

    RETURN QUERY SELECT * FROM public.company_info ORDER BY created_at DESC;
END;
$$;
