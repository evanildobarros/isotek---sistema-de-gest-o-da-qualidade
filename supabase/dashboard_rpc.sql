-- Function to get dashboard metrics
DROP FUNCTION IF EXISTS get_dashboard_metrics(uuid);

CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_company_id UUID)
RETURNS TABLE (
    total_ncs BIGINT,
    audits_completed BIGINT,
    audits_pending BIGINT,
    actions_open BIGINT,
    actions_closed BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (
            (SELECT COUNT(*) FROM non_conformities_products WHERE company_id = p_company_id AND status != 'resolved') +
            (SELECT COUNT(*) FROM corrective_actions WHERE company_id = p_company_id AND status != 'closed') +
            (SELECT COUNT(*) FROM audit_findings af 
             INNER JOIN audit_assignments aa ON af.audit_assignment_id = aa.id 
             WHERE aa.company_id = p_company_id 
             AND af.status = 'open' 
             AND af.severity IN ('nao_conformidade_menor', 'nao_conformidade_maior'))
        ) AS total_ncs,
        (
            (SELECT COUNT(*) FROM audits WHERE company_id = p_company_id AND status = 'Concluída') +
            (SELECT COUNT(*) FROM audit_assignments WHERE company_id = p_company_id AND status IN ('completed', 'concluida'))
        ) AS audits_completed,
        (
            (SELECT COUNT(*) FROM audits WHERE company_id = p_company_id AND status != 'Concluída') +
            (SELECT COUNT(*) FROM audit_assignments WHERE company_id = p_company_id AND status NOT IN ('completed', 'concluida', 'cancelada', 'expired'))
        ) AS audits_pending,
        (SELECT COUNT(*) FROM corrective_actions WHERE company_id = p_company_id AND status != 'closed') AS actions_open,
        (SELECT COUNT(*) FROM corrective_actions WHERE company_id = p_company_id AND status = 'closed') AS actions_closed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
