-- Adicionar company_id na tabela profiles
-- Esta é a coluna que faltava e causava o erro "Unauthorized"

-- Passo 1: Adicionar a coluna company_id na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.company_info(id);

-- Passo 2: Para usuários existentes que não têm company_id, vamos tentar associá-los
-- Opção A: Se o usuário for owner de uma empresa, associá-lo a ela
UPDATE public.profiles p
SET company_id = c.id
FROM public.company_info c
WHERE p.company_id IS NULL
AND c.owner_id = p.id;

-- Opção B: Se ainda houver usuários sem company_id e só existe uma empresa, associá-los a ela
-- (Útil em ambiente de desenvolvimento/teste)
UPDATE public.profiles p
SET company_id = (SELECT id FROM public.company_info LIMIT 1)
WHERE p.company_id IS NULL
AND (SELECT COUNT(*) FROM public.company_info) = 1;

-- Passo 3: Criar índice para melhorar performance das consultas RLS
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);

-- Passo 4: Opcional - Adicionar constraint NOT NULL se desejar que todos os perfis tenham company_id
-- (Comentado por segurança - descomente se quiser forçar que todos tenham company_id)
-- ALTER TABLE public.profiles ALTER COLUMN company_id SET NOT NULL;

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
