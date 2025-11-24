-- Script para adicionar a coluna owner_id na tabela company_info se ela não existir

-- Adicionar coluna owner_id
ALTER TABLE company_info 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Verificar a estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'company_info'
ORDER BY ordinal_position;

-- Agora você pode criar sua empresa
INSERT INTO company_info (name, owner_id)
VALUES ('Minha Empresa', auth.uid())
RETURNING *;
