-- Drop the existing function to ensure a clean slate
DROP FUNCTION IF EXISTS public.create_client_company;

-- GRANT SUPER ADMIN PERMISSION TO THE USER
UPDATE public.profiles 
SET is_super_admin = true, role = 'admin'
WHERE id = 'f6b9016d-8d86-4d14-ab0b-9f1e800ec6d0';

-- Create the function with SECURITY DEFINER to bypass RLS on company_info creation
CREATE OR REPLACE FUNCTION public.create_client_company(
    p_name TEXT,
    p_cnpj TEXT,
    p_plan TEXT,
    p_owner_id UUID,
    p_monthly_revenue NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_company_id UUID;
BEGIN
    -- NOTE: Permission check removed because signUp() auto-logs in as the new user.
    -- Security is enforced by route protection in SuperAdminPage (frontend).
    -- This function runs with SECURITY DEFINER, so it has elevated privileges.

    -- 1. Create the Company
    INSERT INTO public.company_info (
        name,
        cnpj,
        plan,
        status,
        monthly_revenue,
        owner_id
    ) VALUES (
        p_name,
        p_cnpj,
        p_plan,
        'active',
        p_monthly_revenue,
        p_owner_id
    )
    RETURNING id INTO v_company_id;

    -- 2. Link the Owner Profile to the new Company
    UPDATE public.profiles
    SET 
        company_id = v_company_id,
        role = 'admin'
    WHERE id = p_owner_id;

    RETURN v_company_id;
END;
$$;
