-- Enable RLS for Auditors on key tables

-- Documents
create policy "Auditors can view documents"
  on documents for select
  using ( is_active_auditor_for_company(company_id) );

-- 2. Risks Opportunities
ALTER TABLE public.risks_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auditores podem ver riscos de clientes"
ON public.risks_opportunities FOR SELECT
TO authenticated
USING (
    company_id = (SELECT auth.uid() FROM auth.users WHERE auth.uid() = id) -- Owner (mantém compatibilidade)
    OR
    public.is_active_auditor_for_company(company_id) -- Auditor
);

-- Processes
create policy "Auditors can view processes"
  on processes for select
  using ( is_active_auditor_for_company(company_id) );

-- Non Conformities (RNCs)
create policy "Auditors can view non conformities"
  on non_conformities for select
  using ( is_active_auditor_for_company(company_id) );

-- Corrective Actions
create policy "Auditors can view corrective actions"
  on corrective_actions for select
  using ( is_active_auditor_for_company(company_id) );

-- Internal Audits
create policy "Auditors can view audits"
  on audits for select
  using ( is_active_auditor_for_company(company_id) );

-- Indicators (KPIs)
create policy "Auditors can view kpis"
  on quality_objectives for select
  using ( is_active_auditor_for_company(company_id) );

create policy "Auditors can view kpi measurements"
  on kpi_measurements for select
  using ( is_active_auditor_for_company(company_id) );
