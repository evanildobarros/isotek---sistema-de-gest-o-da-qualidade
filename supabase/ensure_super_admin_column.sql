-- Script de Segurança para Garantir a Coluna is_super_admin
-- Este script deve ser rodado ANTES dos scripts de segurança atualizados.
-- Ele garante que a coluna existe para evitar erros de SQL.

DO $$
BEGIN
    -- Verifica se a coluna is_super_admin existe na tabela profiles
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_super_admin'
    ) THEN
        -- Se não existir, cria a coluna
        ALTER TABLE public.profiles 
        ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
        
        RAISE NOTICE 'Coluna is_super_admin criada com sucesso.';
    ELSE
        RAISE NOTICE 'Coluna is_super_admin já existe.';
    END IF;
END $$;
