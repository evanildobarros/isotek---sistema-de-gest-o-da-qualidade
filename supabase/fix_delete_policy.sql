-- Function to delete a company (Super Admin only)
CREATE OR REPLACE FUNCTION public.delete_company(p_company_id uuid)
RETURNS void
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

    -- 1. Unlink Users (Profiles)
    -- We set company_id to NULL so users are not deleted, just detached.
    UPDATE public.profiles 
    SET company_id = NULL, role = 'colaborador' 
    WHERE company_id = p_company_id;

    -- 2. Delete Dependent Data
    -- We must delete data from tables that reference company_info(id)
    
    -- Processes & Scope
    DELETE FROM public.processes WHERE company_id = p_company_id;
    DELETE FROM public.quality_manual WHERE company_id = p_company_id;
    
    -- SWOT Analysis
    DELETE FROM public.swot_analysis WHERE company_id = p_company_id;
    
    -- Audits (if exists)
    BEGIN
        DELETE FROM public.audits WHERE company_id = p_company_id;
    EXCEPTION WHEN undefined_table THEN NULL; END;

    -- Corrective Actions (if exists)
    BEGIN
        DELETE FROM public.corrective_actions WHERE company_id = p_company_id;
    EXCEPTION WHEN undefined_table THEN NULL; END;

    -- Documents (if exists)
    BEGIN
        DELETE FROM public.documents WHERE company_id = p_company_id;
    EXCEPTION WHEN undefined_table THEN NULL; END;

    -- Stakeholders (if exists)
    BEGIN
        DELETE FROM public.stakeholders WHERE company_id = p_company_id;
    EXCEPTION WHEN undefined_table THEN NULL; END;

    -- Units (if exists)
    BEGIN
        DELETE FROM public.units WHERE company_id = p_company_id;
    EXCEPTION WHEN undefined_table THEN NULL; END;

    -- 3. Delete the Company
    DELETE FROM public.company_info WHERE id = p_company_id;
END;
$$;
