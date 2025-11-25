-- Script para corrigir Perfis e garantir company_id
-- 1. Garantir que a coluna company_id existe na tabela profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_id') THEN
        ALTER TABLE public.profiles ADD COLUMN company_id uuid REFERENCES public.company_info(id);
    END IF;

    -- Garantir que a coluna is_active existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2. Garantir que existe pelo menos uma empresa
DO $$
DECLARE
    v_company_id uuid;
BEGIN
    -- Tenta pegar a primeira empresa
    SELECT id INTO v_company_id FROM public.company_info LIMIT 1;

    -- Se não existir, cria uma
    IF v_company_id IS NULL THEN
        INSERT INTO public.company_info (name) VALUES ('Minha Empresa') RETURNING id INTO v_company_id;
    END IF;

    -- 3. Criar perfis para usuários que não têm
    INSERT INTO public.profiles (id, company_id, role, is_active)
    SELECT 
        u.id, 
        v_company_id, 
        'gestor', 
        true
    FROM auth.users u
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

    -- 4. Atualizar perfis existentes que estão sem company_id
    UPDATE public.profiles
    SET company_id = v_company_id
    WHERE company_id IS NULL;
    
END $$;
