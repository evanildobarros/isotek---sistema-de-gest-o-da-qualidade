-- Adicionar campos de Elaborador e Aprovador na tabela de documentos
-- Estes campos seguem as melhores práticas de controle de documentos (ISO 9001 - 7.5)

-- 1. Adicionar coluna para o responsável pela elaboração
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS elaborated_by uuid REFERENCES auth.users(id);

-- 2. Adicionar coluna para o responsável pela aprovação
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id);

-- 3. Adicionar data de aprovação
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- 4. Comentários para documentação
COMMENT ON COLUMN documents.elaborated_by IS 'ID do usuário responsável pela elaboração do documento';
COMMENT ON COLUMN documents.approved_by IS 'ID do usuário que aprovou o documento';
COMMENT ON COLUMN documents.approved_at IS 'Data/hora da aprovação do documento';

-- 5. Criar view para facilitar consultas com nomes dos responsáveis
CREATE OR REPLACE VIEW documents_with_responsibles AS
SELECT 
    d.*,
    p_elaborated.full_name as elaborated_by_name,
    p_approved.full_name as approved_by_name
FROM documents d
LEFT JOIN profiles p_elaborated ON d.elaborated_by = p_elaborated.id
LEFT JOIN profiles p_approved ON d.approved_by = p_approved.id;

-- 6. Verificar resultado
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;
