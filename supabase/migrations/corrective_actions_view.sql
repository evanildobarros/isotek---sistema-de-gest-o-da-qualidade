-- =============================================
-- View: corrective_actions_with_details
-- Descrição: View que junta corrective_actions com o nome do responsável
-- =============================================

CREATE OR REPLACE VIEW corrective_actions_with_details AS
SELECT 
    ca.id,
    ca.company_id,
    ca.code,
    ca.origin,
    ca.description,
    ca.root_cause,
    ca.immediate_action,
    ca.deadline,
    ca.responsible_id,
    ca.status,
    ca.effectiveness_verified,
    ca.effectiveness_notes,
    ca.created_at,
    ca.updated_at,
    p.full_name as responsible_name
FROM corrective_actions ca
LEFT JOIN profiles p ON ca.responsible_id = p.id;

-- Permissões
GRANT SELECT ON corrective_actions_with_details TO authenticated;

-- RLS na view (segue a política da tabela base)
-- Nota: Views herdam RLS das tabelas subjacentes no Postgres
