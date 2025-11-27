-- Remover todos os triggers potencialmente problemáticos e recriá-los
-- Isso corrige o erro "record new has no field issue"

-- Passo 1: Listar e remover TODOS os triggers da tabela corrective_actions
-- (exceto triggers do sistema)
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'public.corrective_actions'::regclass
        AND tgname NOT LIKE 'RI_%' -- Não remover triggers de foreign keys
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.corrective_actions', trigger_record.tgname);
        RAISE NOTICE 'Trigger % removido', trigger_record.tgname;
    END LOOP;
END $$;

-- Passo 2: Recriar apenas o trigger de updated_at (que é o correto)
-- Primeiro, garantir que a função existe
CREATE OR REPLACE FUNCTION update_corrective_actions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
DROP TRIGGER IF EXISTS corrective_actions_updated_at ON public.corrective_actions;
CREATE TRIGGER corrective_actions_updated_at
  BEFORE UPDATE ON public.corrective_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_corrective_actions_updated_at();

-- Verificação: Listar triggers restantes
SELECT 
    tgname as trigger_nome,
    tgenabled as habilitado
FROM pg_trigger 
WHERE tgrelid = 'public.corrective_actions'::regclass
AND tgname NOT LIKE 'RI_%'
ORDER BY tgname;

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
