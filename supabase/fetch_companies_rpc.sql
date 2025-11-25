-- Function to fetch all companies (Super Admin only)
CREATE OR REPLACE FUNCTION public.get_all_companies()
RETURNS SETOF public.company_info
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres), bypassing RLS
AS $$
DECLARE
    v_caller_is_admin boolean;
BEGIN
    -- 1. Security Check: Ensure caller is Super Admin
    SELECT (is_super_admin IS TRUE OR auth.jwt() ->> 'email' = 'evanildobarros@gmail.com')
    INTO v_caller_is_admin
    FROM public.profiles
    WHERE id = auth.uid();

    -- Fallback
    IF v_caller_is_admin IS NULL THEN
        v_caller_is_admin := (auth.jwt() ->> 'email' = 'evanildobarros@gmail.com');
    END IF;

    IF v_caller_is_admin IS NOT TRUE THEN
        RAISE EXCEPTION 'Acesso Negado';
    END IF;

    -- 2. Return all companies
    RETURN QUERY SELECT * FROM public.company_info ORDER BY created_at DESC;
END;
$$;
