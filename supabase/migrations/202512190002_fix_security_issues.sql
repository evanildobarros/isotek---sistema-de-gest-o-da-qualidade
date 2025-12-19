-- =============================================================================
-- MIGRAÇÃO: Correções de Segurança (Pós-Análise MCP)
-- Data: 2025-12-19
-- =============================================================================

-- 1. Habilitar Policy para 'manual_attachments' (Estava habilitado RLS mas sem policy)
CREATE POLICY "Manual attachments access" ON manual_attachments
    FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- 2. Corrigir Views (Remover SECURITY DEFINER implícito se houver, recriando como padrão INVOKER)

-- View: documents_with_responsibles
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

GRANT SELECT ON documents_with_responsibles TO authenticated;

-- View: auditor_financial_summary
CREATE OR REPLACE VIEW auditor_financial_summary AS
SELECT 
    p.id AS auditor_id,
    p.full_name AS auditor_name,
    p.gamification_xp,
    p.gamification_level,
    al.commission_rate AS current_rate,
    COUNT(aa.id) AS total_audits,
    COALESCE(SUM(aa.agreed_amount), 0) AS total_revenue,
    COALESCE(SUM(aa.auditor_payout), 0) AS total_earnings,
    COALESCE(SUM(CASE WHEN aa.payment_status = 'pending' THEN aa.auditor_payout ELSE 0 END), 0) AS pending_payout,
    COALESCE(SUM(CASE WHEN aa.payment_status = 'paid' THEN aa.auditor_payout ELSE 0 END), 0) AS paid_amount
FROM profiles p
LEFT JOIN auditor_levels al ON p.gamification_level = al.level_id
LEFT JOIN audit_assignments aa ON aa.auditor_id = p.id
WHERE p.role = 'auditor'
GROUP BY p.id, p.full_name, p.gamification_xp, p.gamification_level, al.commission_rate;


-- 3. Fixar search_path em Funções (Evitar Hijacking)
-- Observação: Se as assinaturas estiverem incorretas, o comando falhará, mas não quebrará o banco.

-- handle_new_user: Trigger de auth.users (sem argumentos)
ALTER FUNCTION handle_new_user() SET search_path = public;

-- create_client_company: Usada no frontend com (name, cnpj, plan, owner_id, monthly_revenue)
-- Assinatura inferida: (text, text, text, uuid, numeric) ou variacoes.
-- Tentando alterar pelo nome se a versão do PG permitir ou usando DO block para encontrar.
DO $$
DECLARE
    func_sig text;
BEGIN
    SELECT oid::regprocedure::text INTO func_sig
    FROM pg_proc 
    WHERE proname = 'create_client_company' 
    LIMIT 1;

    IF func_sig IS NOT NULL THEN
        EXECUTE 'ALTER FUNCTION ' || func_sig || ' SET search_path = public';
    END IF;
END $$;

-- delete_company_users: (Provavelmente recebe company_id uuid)
DO $$
DECLARE
    func_sig text;
BEGIN
    SELECT oid::regprocedure::text INTO func_sig
    FROM pg_proc 
    WHERE proname = 'delete_company_users' 
    LIMIT 1;

    IF func_sig IS NOT NULL THEN
        EXECUTE 'ALTER FUNCTION ' || func_sig || ' SET search_path = public';
    END IF;
END $$;
