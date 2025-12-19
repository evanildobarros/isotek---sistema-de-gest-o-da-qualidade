-- =============================================================================
-- MIGRAÇÃO: Configurar Auditor Externo (auditor@gmail.com)
-- Data: 2025-12-19
-- =============================================================================

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- 1. Buscar ID do usuário pelo email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email ILIKE 'auditor@gmail.com';

    -- 2. Atualizar o perfil se encontrado
    IF v_user_id IS NOT NULL THEN
        UPDATE public.profiles
        SET 
            role = 'auditor',           -- Garante role de auditor
            is_super_admin = false,     -- Auditor não é super admin
            full_name = COALESCE(full_name, 'Auditor Externo'),
            company_id = NULL           -- Auditores externos geralmente não pertencem a uma empresa de cliente específica
                                        -- (ou pertencem à empresa de auditoria? Manter NULL por enquanto para ser "externo")
        WHERE id = v_user_id;

        -- Opcional: Se ele precisar estar vinculado a uma empresa "Isotek" para ver dados, 
        -- a lógica deve ser ajustada. Mas "Externo" sugere independência.
        -- Se o sistema exigir company_id para login, talvez precise vincular à "Isotek LTDA" mas com role 'auditor'.
        -- UPDATE public.profiles SET company_id = (SELECT id FROM company_info WHERE name ILIKE '%Isotek%' LIMIT 1) WHERE id = v_user_id;
    END IF;
END $$;
