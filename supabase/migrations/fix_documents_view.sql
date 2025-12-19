-- =============================================================================
-- MIGRAÇÃO: Correção da View documents_with_responsibles
-- Descrição: Garante a coluna next_review_date e recria a view com joins
-- Data: 2025-12-19
-- =============================================================================

-- 1. Garantir que a coluna existe na tabela documents
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'next_review_date'
    ) THEN
        ALTER TABLE documents ADD COLUMN next_review_date date;
        COMMENT ON COLUMN documents.next_review_date IS 'Data programada para a próxima revisão do documento';
    END IF;
END $$;

-- 2. Recriar a view documents_with_responsibles
-- Usamos DROP e CREATE para garantir que o esquema da view seja atualizado
DROP VIEW IF EXISTS documents_with_responsibles;

CREATE VIEW documents_with_responsibles AS
SELECT 
    d.id,
    d.company_id,
    d.title,
    d.code,
    d.version,
    d.status,
    d.file_url,
    d.file_name,
    d.file_size,
    d.uploaded_at,
    d.owner_id,
    d.elaborated_by,
    d.approved_by,
    d.approved_at,
    d.next_review_date,
    d.updated_at,
    p_elaborated.full_name as elaborated_by_name,
    p_approved.full_name as approved_by_name
FROM documents d
LEFT JOIN profiles p_elaborated ON d.elaborated_by = p_elaborated.id
LEFT JOIN profiles p_approved ON d.approved_by = p_approved.id;

-- 3. Permissões
GRANT SELECT ON documents_with_responsibles TO authenticated;

-- Comentário na view
COMMENT ON VIEW documents_with_responsibles IS 'View detalhada de documentos com nomes de elaboradores e aprovadores';
