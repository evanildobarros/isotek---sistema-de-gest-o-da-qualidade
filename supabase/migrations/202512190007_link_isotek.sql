-- =============================================================================
-- MIGRAÇÃO: Vincular Usuário a Isotek e Corrigir Consistência
-- Data: 2025-12-19
-- =============================================================================

DO $$
DECLARE
    v_user_id UUID := '4731f4ec-6460-4a46-b8ad-19fc721ce1b7';
    v_company_id UUID;
BEGIN
    -- 1. Tentar encontrar a empresa Isotek
    -- A tabela de empresas parece ser 'company_info' ou 'companies' (se não apareceu no list, talvez client_companies?)
    -- Baseado no list anterior: 'company_info' existe (FK constraint 'company_info_owner_id_fkey').
    
    SELECT id INTO v_company_id
    FROM company_info
    WHERE company_name ILIKE '%Isotek%'
    LIMIT 1;

    -- Se não achar, procura qualquer empresa para vincular (fallback seguro se for dev)
    IF v_company_id IS NULL THEN
        SELECT id INTO v_company_id FROM company_info LIMIT 1;
    END IF;

    -- 2. Atualizar o perfil do usuário
    IF v_company_id IS NOT NULL THEN
        UPDATE public.profiles
        SET 
            company_id = v_company_id,
            role = 'admin',
            is_super_admin = true,
            is_active = true,
            full_name = 'EVANILDO DE JESUS CAMPOS BARROS'
        WHERE id = v_user_id;
    END IF;

    -- 3. (Opcional) Garantir que ele seja owner de alguma empresa se precisar
    -- Mas o foco aqui é o vínculo 'company_id' para o RLS funcionar
END $$;
