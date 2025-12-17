-- =============================================================================
-- MIGRAÇÃO IDEMPOTENTE: Infraestrutura de Auditoria Externa
-- Descrição: Cria/atualiza tabelas e políticas de forma segura
-- Data: 2025-12-16
-- NOTA: Este script pode ser executado múltiplas vezes sem erro
-- =============================================================================

-- =============================================================================
-- PARTE 1: LIMPAR POLÍTICAS EXISTENTES (para evitar erros de duplicação)
-- =============================================================================

-- Políticas de audit_assignments
DROP POLICY IF EXISTS "Auditors can view own assignments" ON audit_assignments;
DROP POLICY IF EXISTS "Auditor view assignments" ON audit_assignments;
DROP POLICY IF EXISTS "Company view assignments" ON audit_assignments;
DROP POLICY IF EXISTS "Company admins can view assignments for their company" ON audit_assignments;
DROP POLICY IF EXISTS "Company admins can insert assignments for their company" ON audit_assignments;
DROP POLICY IF EXISTS "Company admins can update assignments for their company" ON audit_assignments;
DROP POLICY IF EXISTS "Company admins can delete assignments for their company" ON audit_assignments;
DROP POLICY IF EXISTS "Super admins full access to audit_assignments" ON audit_assignments;

-- Políticas de audit_findings
DROP POLICY IF EXISTS "Auditor manage findings" ON audit_findings;
DROP POLICY IF EXISTS "Company view findings" ON audit_findings;
DROP POLICY IF EXISTS "Auditor: Visualizar constatações" ON audit_findings;
DROP POLICY IF EXISTS "Auditor: Criar constatações" ON audit_findings;
DROP POLICY IF EXISTS "Auditor: Atualizar constatações" ON audit_findings;
DROP POLICY IF EXISTS "Auditor: Deletar constatações" ON audit_findings;
DROP POLICY IF EXISTS "Empresa: Visualizar constatações" ON audit_findings;
DROP POLICY IF EXISTS "Empresa: Responder constatações" ON audit_findings;
DROP POLICY IF EXISTS "Super Admin: Acesso total" ON audit_findings;

-- =============================================================================
-- PARTE 2: CRIAR/ATUALIZAR TABELA audit_assignments
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES company_info(id) ON DELETE CASCADE NOT NULL,
  auditor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text CHECK (status IN ('pending', 'active', 'completed', 'expired', 'agendada', 'em_andamento', 'concluida', 'cancelada')) DEFAULT 'active',
  start_date date DEFAULT current_date,
  end_date date,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS audit_assignments_auditor_id_idx ON audit_assignments(auditor_id);
CREATE INDEX IF NOT EXISTS audit_assignments_company_id_idx ON audit_assignments(company_id);
CREATE INDEX IF NOT EXISTS audit_assignments_status_idx ON audit_assignments(status);

-- Habilitar RLS
ALTER TABLE audit_assignments ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PARTE 3: CRIAR/ATUALIZAR TABELA audit_findings
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_findings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_assignment_id uuid REFERENCES audit_assignments(id) ON DELETE CASCADE NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('document', 'risk', 'rnc', 'supplier', 'process', 'objective', 'training', 'audit', 'general')),
  entity_id uuid,
  severity text CHECK (severity IN ('conforme', 'oportunidade', 'nao_conformidade_menor', 'nao_conformidade_maior')),
  auditor_notes text,
  company_response text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'waiting_validation', 'closed')),
  iso_clause text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Adicionar colunas se não existirem (para migrações incrementais)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_findings' AND column_name = 'severity') THEN
    ALTER TABLE audit_findings ADD COLUMN severity text 
      CHECK (severity IN ('conforme', 'oportunidade', 'nao_conformidade_menor', 'nao_conformidade_maior'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_findings' AND column_name = 'company_response') THEN
    ALTER TABLE audit_findings ADD COLUMN company_response text;
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS audit_findings_assignment_idx ON audit_findings(audit_assignment_id);
CREATE INDEX IF NOT EXISTS audit_findings_entity_idx ON audit_findings(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_findings_status_idx ON audit_findings(status);

-- Habilitar RLS
ALTER TABLE audit_findings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PARTE 4: POLÍTICAS RLS - audit_assignments
-- =============================================================================

-- Auditor vê suas designações
CREATE POLICY "Auditor view assignments" ON audit_assignments
  FOR SELECT USING (auditor_id = auth.uid());

-- Empresa vê auditores vinculados a ela
CREATE POLICY "Company view assignments" ON audit_assignments
  FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Empresa pode gerenciar seus vínculos
CREATE POLICY "Company manage assignments" ON audit_assignments
  FOR ALL USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Super Admin acesso total
CREATE POLICY "Super admin access audit_assignments" ON audit_assignments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
  );

-- =============================================================================
-- PARTE 5: POLÍTICAS RLS - audit_findings
-- =============================================================================

-- Auditor pode gerenciar constatações de suas auditorias
CREATE POLICY "Auditor manage findings" ON audit_findings
  FOR ALL USING (
    audit_assignment_id IN (SELECT id FROM audit_assignments WHERE auditor_id = auth.uid())
  );

-- Empresa pode ver e responder constatações
CREATE POLICY "Company view findings" ON audit_findings
  FOR SELECT USING (
    audit_assignment_id IN (
      SELECT id FROM audit_assignments 
      WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Empresa pode atualizar company_response
CREATE POLICY "Company respond to findings" ON audit_findings
  FOR UPDATE USING (
    audit_assignment_id IN (
      SELECT id FROM audit_assignments 
      WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Super Admin acesso total
CREATE POLICY "Super admin access audit_findings" ON audit_findings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
  );

-- =============================================================================
-- PARTE 6: FUNÇÃO HELPER
-- =============================================================================

CREATE OR REPLACE FUNCTION is_active_auditor_for_company(target_company_id uuid)
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION is_active_auditor_for_company(uuid) TO authenticated;

-- =============================================================================
-- PARTE 7: VIEW DE RESUMO
-- =============================================================================

DROP VIEW IF EXISTS audit_findings_summary;

CREATE VIEW audit_findings_summary AS
SELECT 
  aa.id AS audit_assignment_id,
  aa.company_id,
  aa.auditor_id,
  aa.status AS audit_status,
  COUNT(af.id) AS total_findings,
  COUNT(af.id) FILTER (WHERE af.severity = 'conforme') AS conformes,
  COUNT(af.id) FILTER (WHERE af.severity = 'nao_conformidade_maior') AS nao_conformes_maiores,
  COUNT(af.id) FILTER (WHERE af.severity = 'nao_conformidade_menor') AS nao_conformes_menores,
  COUNT(af.id) FILTER (WHERE af.severity = 'oportunidade') AS oportunidades,
  COUNT(af.id) FILTER (WHERE af.status = 'open') AS pendentes,
  COUNT(af.id) FILTER (WHERE af.status = 'waiting_validation') AS aguardando_validacao,
  COUNT(af.id) FILTER (WHERE af.status = 'closed') AS resolvidas
FROM audit_assignments aa
LEFT JOIN audit_findings af ON af.audit_assignment_id = aa.id
GROUP BY aa.id, aa.company_id, aa.auditor_id, aa.status;

-- =============================================================================
-- PRONTO! Estrutura de Auditoria Externa configurada com sucesso.
-- =============================================================================
