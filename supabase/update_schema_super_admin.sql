-- 1. Update Profiles Table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.company_info(id);

-- 2. Update Company Info Table
ALTER TABLE public.company_info
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'start',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS monthly_revenue NUMERIC DEFAULT 0;

-- 3. Create RPC to fetch all companies
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

-- 4. Create RPC to create client company
CREATE OR REPLACE FUNCTION public.create_client_company(
    p_name text,
    p_cnpj text,
    p_plan text,
    p_owner_id uuid,
    p_monthly_revenue numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_company_id uuid;
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

    -- Insert Company
    INSERT INTO public.company_info (name, cnpj, plan, status, owner_id, monthly_revenue)
    VALUES (p_name, p_cnpj, p_plan, 'active', p_owner_id, p_monthly_revenue)
    RETURNING id INTO v_company_id;

    -- Update Profile
    UPDATE public.profiles
    SET company_id = v_company_id,
        role = 'admin',
        is_active = true
    WHERE id = p_owner_id;

    RETURN json_build_object('id', v_company_id);
END;
$$;
