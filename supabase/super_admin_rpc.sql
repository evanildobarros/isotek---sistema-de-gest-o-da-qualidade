-- Function to create a company and link it to a user (Super Admin only)
DROP FUNCTION IF EXISTS public.create_client_company(text, text, text, uuid, numeric);

CREATE OR REPLACE FUNCTION public.create_client_company(
    p_name text,
    p_cnpj text,
    p_plan text,
    p_owner_id uuid,
    p_monthly_revenue numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres), bypassing RLS
AS $$
DECLARE
    v_company_id uuid;
    v_caller_is_admin boolean;
BEGIN
    -- 1. Security Check: Ensure caller is Super Admin
    SELECT (is_super_admin IS TRUE)
    INTO v_caller_is_admin
    FROM public.profiles
    WHERE id = auth.uid();

    -- Fallback if profile not found (shouldn't happen for logged in user, but safety first)
    IF v_caller_is_admin IS NULL THEN
        v_caller_is_admin := false;
    END IF;

    IF v_caller_is_admin IS NOT TRUE THEN
        RAISE EXCEPTION 'Acesso Negado: Apenas Super Admins podem realizar esta ação.';
    END IF;

    -- 2. Insert Company
    INSERT INTO public.company_info (name, cnpj, plan, status, owner_id, monthly_revenue)
    VALUES (p_name, p_cnpj, p_plan, 'active', p_owner_id, p_monthly_revenue)
    RETURNING id INTO v_company_id;

    -- 3. Update Profile of the new owner (Link to company and set as admin)
    -- Note: The profile should have been created by the trigger on auth.users insert
    UPDATE public.profiles
    SET company_id = v_company_id,
        role = 'admin',
        is_active = true
    WHERE id = p_owner_id;

    RETURN json_build_object('id', v_company_id);
END;
$$;
