-- =============================================================================
-- MIGRAÇÃO: Corrigir Vínculo de Empresa (Isotek LTDA)
-- Data: 2025-12-19
-- =============================================================================

DO $$
DECLARE
    v_user_id UUID := '4731f4ec-6460-4a46-b8ad-19fc721ce1b7';
    v_isotek_id UUID;
BEGIN
    -- 1. Tentar encontrar Isotek (busca exata ou aproximada)
    SELECT id INTO v_isotek_id
    FROM company_info
    WHERE name ILIKE '%Isotek%' 
    ORDER BY created_at ASC -- Preferir a mais antiga se houver duplicatas
    LIMIT 1;

    -- 2. Se não existir, criar a empresa "Isotek LTDA"
    IF v_isotek_id IS NULL THEN
        INSERT INTO company_info (name, owner_id, plan_id, subscription_status)
        VALUES ('Isotek LTDA', v_user_id, 'enterprise', 'active')
        RETURNING id INTO v_isotek_id;
    END IF;

    -- 3. Atualizar o perfil do usuário para apontar para a Isotek
    IF v_isotek_id IS NOT NULL THEN
        UPDATE public.profiles
        SET 
            company_id = v_isotek_id,
            role = 'admin',
            is_super_admin = true,
            full_name = 'EVANILDO DE JESUS CAMPOS BARROS' -- Garantir nome
        WHERE id = v_user_id;
        
        -- Atualizar owner da empresa para garantir consistência
        UPDATE company_info
        SET owner_id = v_user_id
        WHERE id = v_isotek_id AND owner_id IS NULL;
    END IF;
    
END $$;
