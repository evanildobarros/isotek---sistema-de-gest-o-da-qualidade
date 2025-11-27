-- Script de diagnóstico para verificar o perfil do usuário
-- Execute este script para verificar se há problemas com company_id

-- Verificar perfis sem company_id
SELECT 
    id,
    full_name,
    company_id,
    created_at,
    CASE 
        WHEN company_id IS NULL THEN '❌ SEM COMPANY_ID'
        ELSE '✅ OK'
    END as status
FROM public.profiles
ORDER BY created_at DESC
LIMIT 20;

-- Verificar se há dados em corrective_actions
SELECT COUNT(*) as total_acoes_corretivas FROM public.corrective_actions;

-- Verificar se RLS está ativado
SELECT 
    tablename,
    rowsecurity as rls_ativo
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('corrective_actions', 'corrective_action_tasks')
ORDER BY tablename;
