-- =============================================================================
-- MIGRAÇÃO: Forçar Super Admin (Case Insensitive + Fallback)
-- Data: 2025-12-19
-- =============================================================================

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- 1. Tentar pegar ID da tabela auth.users ignorando case
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email ILIKE 'evanildobarros@gmail.com'
    LIMIT 1;

    -- 2. Se achou usuário, atualiza perfil pelo ID
    IF v_user_id IS NOT NULL THEN
        UPDATE public.profiles
        SET 
            is_super_admin = true, 
            role = 'admin'
        WHERE id = v_user_id;
    END IF;

    -- 3. Por garantia, atualiza qualquer perfil que tenha esse email como nome (já que vimos no screenshot)
    UPDATE public.profiles
    SET 
        is_super_admin = true, 
        role = 'admin'
    WHERE full_name ILIKE 'evanildobarros@gmail.com';
    
END $$;
