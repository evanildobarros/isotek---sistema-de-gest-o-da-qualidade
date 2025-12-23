-- =============================================================================
-- MIGRAÇÃO: RPC delete_company
-- Data: 2025-12-22
-- Descrição: Realiza a exclusão completa de uma empresa e todos os seus dados.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.delete_company(p_company_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_super_admin boolean;
BEGIN
    -- 1. Verificação de Segurança (Apenas Super Admins)
    SELECT is_super_admin INTO v_is_super_admin
    FROM profiles
    WHERE id = auth.uid();

    IF NOT COALESCE(v_is_super_admin, false) AND auth.uid() IS NOT NULL THEN
        RAISE EXCEPTION 'Acesso negado: Apenas super administradores podem excluir empresas.';
    END IF;

    -- 2. Exclusão em Cascata (Filhos primeiro para evitar violação de FK)

    -- Auditoria
    DELETE FROM audit_findings WHERE audit_assignment_id IN (SELECT id FROM audit_assignments WHERE company_id = p_company_id);
    DELETE FROM audit_checklist_responses WHERE audit_id IN (SELECT id FROM audits WHERE company_id = p_company_id);
    DELETE FROM audit_assignments WHERE company_id = p_company_id;
    DELETE FROM audits WHERE company_id = p_company_id;
    DELETE FROM audit_checklist_items WHERE template_id IN (SELECT id FROM audit_checklist_templates WHERE company_id = p_company_id);
    DELETE FROM audit_checklist_templates WHERE company_id = p_company_id;

    -- Planejamento, Riscos e Objetivos
    DELETE FROM risk_tasks WHERE risk_id IN (SELECT id FROM risks_opportunities WHERE company_id = p_company_id);
    DELETE FROM risks_opportunities WHERE company_id = p_company_id;
    DELETE FROM kpi_measurements WHERE company_id = p_company_id;
    DELETE FROM quality_objectives WHERE company_id = p_company_id;
    DELETE FROM swot_analysis WHERE company_id = p_company_id;
    DELETE FROM stakeholders WHERE company_id = p_company_id;
    DELETE FROM management_reviews WHERE company_id = p_company_id;

    -- Melhoria
    DELETE FROM corrective_action_tasks WHERE corrective_action_id IN (SELECT id FROM corrective_actions WHERE company_id = p_company_id);
    DELETE FROM corrective_actions WHERE company_id = p_company_id;
    DELETE FROM non_conformities_products WHERE company_id = p_company_id;

    -- Operação
    DELETE FROM production_orders WHERE company_id = p_company_id;
    DELETE FROM sales_orders WHERE company_id = p_company_id;
    DELETE FROM manual_attachments WHERE company_id = p_company_id;
    DELETE FROM documents WHERE company_id = p_company_id;
    DELETE FROM processes WHERE company_id = p_company_id;
    DELETE FROM quality_manual WHERE company_id = p_company_id;

    -- Suprimentos e RH
    DELETE FROM supplier_evaluations WHERE supplier_id IN (SELECT id FROM suppliers WHERE company_id = p_company_id);
    DELETE FROM suppliers WHERE company_id = p_company_id;
    DELETE FROM employee_trainings WHERE employee_id IN (SELECT id FROM employees WHERE company_id = p_company_id);
    DELETE FROM employees WHERE company_id = p_company_id;

    -- Unidades e Notificações
    DELETE FROM units WHERE company_id = p_company_id;
    DELETE FROM notifications WHERE company_id = p_company_id;

    -- Perfis dos Usuários
    DELETE FROM profiles WHERE company_id = p_company_id;

    -- Empresa (Finalmente)
    DELETE FROM company_info WHERE id = p_company_id;

END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.delete_company(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_company(uuid) TO service_role;
