-- Function to get dashboard metrics
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
            (SELECT COUNT(*) FROM non_conformities_products WHERE company_id = p_company_id) +
            (SELECT COUNT(*) FROM corrective_actions WHERE company_id = p_company_id)
        ) AS total_ncs,
        (SELECT COUNT(*) FROM audits WHERE company_id = p_company_id AND status = 'Concluída') AS audits_completed,
        (SELECT COUNT(*) FROM audits WHERE company_id = p_company_id AND status != 'Concluída') AS audits_pending,
        (SELECT COUNT(*) FROM corrective_actions WHERE company_id = p_company_id AND status != 'closed') AS actions_open,
        (SELECT COUNT(*) FROM corrective_actions WHERE company_id = p_company_id AND status = 'closed') AS actions_closed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
