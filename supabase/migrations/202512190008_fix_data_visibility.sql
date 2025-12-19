-- =============================================================================
-- MIGRAÇÃO: Recuperar Visibilidade de Dados (Unir usuário à empresa com dados)
-- Data: 2025-12-19
-- =============================================================================

DO $$
DECLARE
    v_user_id UUID := '4731f4ec-6460-4a46-b8ad-19fc721ce1b7';
    v_target_company_id UUID;
BEGIN
    -- 1. Encontrar o ID da empresa que TEM DADOS (Missão, Visão ou Valores)
    -- Isso recupera o acesso aos dados que "sumiram"
    SELECT id INTO v_target_company_id
    FROM company_info
    WHERE mission IS NOT NULL 
       OR vision IS NOT NULL 
       OR values IS NOT NULL
       OR slogan IS NOT NULL
    LIMIT 1;

    -- Fallback: Se não achar por dados, tenta pegar a primeira criada
    IF v_target_company_id IS NULL THEN
        SELECT id INTO v_target_company_id FROM company_info ORDER BY created_at ASC LIMIT 1;
    END IF;

    -- 2. Atualizar o perfil do usuário para apontar para essa empresa
    IF v_target_company_id IS NOT NULL THEN
        UPDATE public.profiles
        SET 
            company_id = v_target_company_id,
            role = 'admin',
            is_super_admin = true
        WHERE id = v_user_id;
    END IF;
    
END $$;
