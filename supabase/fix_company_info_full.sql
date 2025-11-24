-- Script completo para corrigir a tabela company_info
-- Adiciona colunas faltantes e cria o registro da empresa

-- 1. Adicionar coluna 'name' se não existir
ALTER TABLE company_info 
ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Minha Empresa';

-- 2. Adicionar coluna 'owner_id' se não existir
ALTER TABLE company_info 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- 3. Verificar estrutura atual (para debug)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'company_info';

-- 4. Inserir empresa se não existir
INSERT INTO company_info (name, owner_id)
SELECT 'Minha Empresa', auth.uid()
WHERE NOT EXISTS (
    SELECT 1 FROM company_info WHERE owner_id = auth.uid()
);

-- 5. Retornar a empresa do usuário atual para confirmação
SELECT * FROM company_info WHERE owner_id = auth.uid();
