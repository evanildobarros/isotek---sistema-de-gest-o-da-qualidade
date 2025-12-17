-- Correção da Política RLS para Risks & Opportunities (Versão Robusta)

-- 1. Garantir que a função auxiliar existe e é segura (Security Definer + Search Path)
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

GRANT EXECUTE ON FUNCTION public.get_user_company_id() TO authenticated;

-- 2. Limpar políticas antigas/incorretas
DROP POLICY IF EXISTS "Auditores podem ver riscos de clientes" ON public.risks_opportunities;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.risks_opportunities;
DROP POLICY IF EXISTS "Risks View Policy (Company & Auditor)" ON public.risks_opportunities;
DROP POLICY IF EXISTS "Risks Manage Policy (Company Only)" ON public.risks_opportunities;

-- 3. Criar política de LEITURA (SELECT)
-- Permite acesso se for da mesma empresa ou se for auditor designado
CREATE POLICY "Risks View Policy (Company & Auditor)"
ON public.risks_opportunities FOR SELECT
TO authenticated
USING (
    company_id = public.get_user_company_id()
    OR
    public.is_active_auditor_for_company(company_id)
    OR
    public.is_current_user_super_admin()
);

-- 4. Criar política de ESCRITA (INSERT/UPDATE/DELETE)
-- Apenas usuários da empresa podem criar/editar (Auditores não editam riscos)
CREATE POLICY "Risks Manage Policy (Company Only)"
ON public.risks_opportunities FOR ALL
TO authenticated
USING (
    company_id = public.get_user_company_id()
    OR
    public.is_current_user_super_admin()
)
WITH CHECK (
    company_id = public.get_user_company_id()
    OR
    public.is_current_user_super_admin()
);
