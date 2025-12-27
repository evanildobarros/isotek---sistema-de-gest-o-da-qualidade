-- =============================================================================
-- MIGRAÇÃO: Permissões de Escrita para Auditores
-- Descrição: Permite que auditores registrem evidências e atualizem o progresso
-- Data: 2025-12-27
-- =============================================================================

-- 1. Permissão para atualizar o progresso da atribuição
DROP POLICY IF EXISTS "Auditors can update their own assignments" ON audit_assignments;
CREATE POLICY "Auditors can update their own assignments" ON audit_assignments
  FOR UPDATE USING (auditor_id = auth.uid())
  WITH CHECK (auditor_id = auth.uid());

-- 2. Permissão para registrar constatações (Findings)
DROP POLICY IF EXISTS "Auditors can insert findings" ON audit_findings;
CREATE POLICY "Auditors can insert findings" ON audit_findings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM audit_assignments aa
      WHERE aa.id = audit_findings.audit_assignment_id
      AND aa.auditor_id = auth.uid()
    )
  );

-- 3. Permissão para registrar RNCs (Ações Corretivas)
DROP POLICY IF EXISTS "Auditors can create corrective actions from audits" ON corrective_actions;
CREATE POLICY "Auditors can create corrective actions from audits" ON corrective_actions
  FOR INSERT WITH CHECK (origin = 'Auditoria');

-- 4. Permissão para enviar notificações durante a auditoria
DROP POLICY IF EXISTS "Auditors can send notifications" ON notifications;
CREATE POLICY "Auditors can send notifications" ON notifications
  FOR INSERT WITH CHECK (true);
