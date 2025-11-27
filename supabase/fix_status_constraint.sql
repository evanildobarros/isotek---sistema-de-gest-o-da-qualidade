-- Corrigir constraint de status na tabela corrective_actions
-- Remove a constraint antiga e cria uma nova com os valores corretos

-- Passo 1: Remover a constraint atual (qualquer que seja o nome dela)
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Encontrar o nome da constraint de status
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.corrective_actions'::regclass
    AND contype = 'c' -- CHECK constraint
    AND pg_get_constraintdef(oid) LIKE '%status%';
    
    -- Se encontrou, remover
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.corrective_actions DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Constraint % removida', constraint_name;
    END IF;
END $$;

-- Passo 2: Adicionar a constraint correta
ALTER TABLE public.corrective_actions
ADD CONSTRAINT corrective_actions_status_check 
CHECK (status IN ('open', 'root_cause_analysis', 'implementation', 'effectiveness_check', 'closed'));

-- Passo 3: Garantir que a coluna tem um valor default
ALTER TABLE public.corrective_actions 
ALTER COLUMN status SET DEFAULT 'open';

-- Verificação: mostrar a nova constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.corrective_actions'::regclass
AND conname LIKE '%status%';

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
