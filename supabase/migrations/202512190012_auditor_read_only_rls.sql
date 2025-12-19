-- =============================================================================
-- MIGRAÇÃO: Acesso Read-Only para Auditores Externos
-- Descrição: Permite que auditores visualizem dados de empresas durante auditorias ativas
-- Data: 2025-12-19
-- =============================================================================

-- Função auxiliar para verificar se o usuário é um auditor com atribuição ativa para a empresa
CREATE OR REPLACE FUNCTION is_auditor_of_company(target_company_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM audit_assignments aa
    WHERE aa.auditor_id = auth.uid()
    AND aa.company_id = target_company_id
    AND aa.status IN ('active', 'em_andamento', 'agendada')
    AND aa.start_date <= current_date
    AND (aa.end_date IS NULL OR aa.end_date >= current_date)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. COMPANY_INFO
DROP POLICY IF EXISTS "Auditor access company_info" ON company_info;
CREATE POLICY "Auditor access company_info" ON company_info
  FOR SELECT USING (is_auditor_of_company(id));

-- 2. PROFILES
DROP POLICY IF EXISTS "Auditor access profiles" ON profiles;
CREATE POLICY "Auditor access profiles" ON profiles
  FOR SELECT USING (is_auditor_of_company(company_id));

-- 3. DOCUMENTS
DROP POLICY IF EXISTS "Auditor access documents" ON documents;
CREATE POLICY "Auditor access documents" ON documents
  FOR SELECT USING (is_auditor_of_company(company_id));

-- 4. QUALITY_MANUAL (SCOPE)
DROP POLICY IF EXISTS "Auditor access quality_manual" ON quality_manual;
CREATE POLICY "Auditor access quality_manual" ON quality_manual
  FOR SELECT USING (is_auditor_of_company(company_id));

-- 5. PROCESSES
DROP POLICY IF EXISTS "Auditor access processes" ON processes;
CREATE POLICY "Auditor access processes" ON processes
  FOR SELECT USING (is_auditor_of_company(company_id));

-- 6. RISKS_OPPORTUNITIES
DROP POLICY IF EXISTS "Auditor access risks" ON risks_opportunities;
CREATE POLICY "Auditor access risks" ON risks_opportunities
  FOR SELECT USING (is_auditor_of_company(company_id));

-- 7. NON_CONFORMITIES_PRODUCTS
DROP POLICY IF EXISTS "Auditor access non_conformities" ON non_conformities_products;
CREATE POLICY "Auditor access non_conformities" ON non_conformities_products
  FOR SELECT USING (is_auditor_of_company(company_id));

-- 8. RISK_TASKS (ACTION PLANS)
DROP POLICY IF EXISTS "Auditor access risk_tasks" ON risk_tasks;
CREATE POLICY "Auditor access risk_tasks" ON risk_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM risks_opportunities ro
      WHERE ro.id = risk_tasks.risk_id
      AND is_auditor_of_company(ro.company_id)
    )
  );

-- 9. MANAGEMENT_REVIEWS
DROP POLICY IF EXISTS "Auditor access management_reviews" ON management_reviews;
CREATE POLICY "Auditor access management_reviews" ON management_reviews
  FOR SELECT USING (is_auditor_of_company(company_id));

-- 10. EMPLOYEES
DROP POLICY IF EXISTS "Auditor access employees" ON employees;
CREATE POLICY "Auditor access employees" ON employees
  FOR SELECT USING (is_auditor_of_company(company_id));

-- 11. EMPLOYEE_TRAININGS
DROP POLICY IF EXISTS "Auditor access employee_trainings" ON employee_trainings;
CREATE POLICY "Auditor access employee_trainings" ON employee_trainings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = employee_trainings.employee_id
      AND is_auditor_of_company(e.company_id)
    )
  );

-- 12. PRODUCTION_ORDERS
DROP POLICY IF EXISTS "Auditor access production_orders" ON production_orders;
CREATE POLICY "Auditor access production_orders" ON production_orders
  FOR SELECT USING (is_auditor_of_company(company_id));

-- 13. SALES_ORDERS
DROP POLICY IF EXISTS "Auditor access sales_orders" ON sales_orders;
CREATE POLICY "Auditor access sales_orders" ON sales_orders
  FOR SELECT USING (is_auditor_of_company(company_id));

-- 14. SUPPLIERS
DROP POLICY IF EXISTS "Auditor access suppliers" ON suppliers;
CREATE POLICY "Auditor access suppliers" ON suppliers
  FOR SELECT USING (is_auditor_of_company(company_id));

-- 15. SUPPLIER_EVALUATIONS
DROP POLICY IF EXISTS "Auditor access supplier_evaluations" ON supplier_evaluations;
CREATE POLICY "Auditor access supplier_evaluations" ON supplier_evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM suppliers s
      WHERE s.id = supplier_evaluations.supplier_id
      AND is_auditor_of_company(s.company_id)
    )
  );

-- 16. QUALITY_OBJECTIVES
DROP POLICY IF EXISTS "Auditor access quality_objectives" ON quality_objectives;
CREATE POLICY "Auditor access quality_objectives" ON quality_objectives
  FOR SELECT USING (is_auditor_of_company(company_id));

-- 17. KPI_MEASUREMENTS
DROP POLICY IF EXISTS "Auditor access kpi_measurements" ON kpi_measurements;
CREATE POLICY "Auditor access kpi_measurements" ON kpi_measurements
  FOR SELECT USING (is_auditor_of_company(company_id));

-- 18. CUSTOMER_SATISFACTION_SURVEYS
DROP POLICY IF EXISTS "Auditor access customer_surveys" ON customer_satisfaction_surveys;
CREATE POLICY "Auditor access customer_surveys" ON customer_satisfaction_surveys
  FOR SELECT USING (is_auditor_of_company(company_id));

-- 19. SWOT_ANALYSIS
DROP POLICY IF EXISTS "Auditor access swot" ON swot_analysis;
CREATE POLICY "Auditor access swot" ON swot_analysis
  FOR SELECT USING (is_auditor_of_company(company_id));

-- 20. STAKEHOLDERS
DROP POLICY IF EXISTS "Auditor access stakeholders" ON stakeholders;
CREATE POLICY "Auditor access stakeholders" ON stakeholders
  FOR SELECT USING (is_auditor_of_company(company_id));

-- COMENTÁRIO FINAL
COMMENT ON FUNCTION is_auditor_of_company IS 'Verifica se o usuário logado é um auditor associado à empresa com auditoria ativa ou agendada.';
