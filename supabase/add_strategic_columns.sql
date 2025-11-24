-- Adicionar colunas para Definição Estratégica na tabela company_info

ALTER TABLE company_info 
ADD COLUMN IF NOT EXISTS mission TEXT,
ADD COLUMN IF NOT EXISTS vision TEXT,
ADD COLUMN IF NOT EXISTS "values" TEXT; -- "values" é palavra reservada, usar aspas

-- Verificar estrutura
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'company_info';
