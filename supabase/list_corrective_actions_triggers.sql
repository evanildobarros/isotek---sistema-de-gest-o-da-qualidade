-- Encontrar e listar todos os triggers na tabela corrective_actions
-- Execute este script para ver quais triggers existem

SELECT 
    tgname as trigger_name,
    proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.corrective_actions'::regclass
ORDER BY tgname;
