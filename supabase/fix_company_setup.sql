-- Script para verificar e criar registro de empresa se necessário
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se você já tem uma empresa
SELECT * FROM company_info WHERE owner_id = auth.uid();

-- 2. Se não retornou nada, execute este INSERT para criar sua empresa:
-- (Descomente as linhas abaixo removendo os -- do início)

-- INSERT INTO company_info (name, owner_id)
-- VALUES ('Minha Empresa', auth.uid())
-- RETURNING *;

-- 3. Após criar a empresa, você pode verificar novamente:
-- SELECT * FROM company_info WHERE owner_id = auth.uid();

-- 4. Agora você pode testar criando uma unidade manualmente para verificar:
-- (Substitua 'SEU_COMPANY_ID_AQUI' pelo ID retornado no passo 2)

-- INSERT INTO units (company_id, name, is_headquarters, address, city, state)
-- VALUES (
--   'SEU_COMPANY_ID_AQUI',
--   'Matriz São Luís',
--   true,
--   'Rua Exemplo, 123',
--   'São Luís',
--   'MA'
-- )
-- RETURNING *;
