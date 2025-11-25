-- Function to fetch all companies with owner details (Super Admin only)
DROP FUNCTION IF EXISTS public.get_all_companies();

CREATE OR REPLACE FUNCTION public.get_all_companies()
RETURNS TABLE (
    id uuid,
    created_at timestamptz,
    name text,
    owner_id uuid,
    cnpj text,
    plan text,
    status text,
    monthly_revenue numeric,
    owner_name text,
    owner_email text
)
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

    RETURN QUERY 
    SELECT 
        c.id,
        c.created_at,
        c.name,
        c.owner_id,
        c.cnpj,
        c.plan,
        c.status,
        c.monthly_revenue,
        p.full_name as owner_name,
        u.email as owner_email
    FROM public.company_info c
    LEFT JOIN public.profiles p ON c.owner_id = p.id
    LEFT JOIN auth.users u ON c.owner_id = u.id
    ORDER BY c.created_at DESC;
END;
$$;
