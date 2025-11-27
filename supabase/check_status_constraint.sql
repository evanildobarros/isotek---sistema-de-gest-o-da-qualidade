-- Verificar a constraint de status na tabela corrective_actions
-- Execute este script para ver qual é a constraint atual

-- Ver todas as constraints da tabela corrective_actions
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.corrective_actions'::regclass
AND conname LIKE '%status%';

-- Ver a definição completa da coluna status
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'corrective_actions'
AND column_name = 'status';
