-- =============================================================================
-- MIGRAÇÃO: Auditoria 2.0 - Sistema Completo de Checklist e Evidências
-- Compatível com ISO 19011 (Diretrizes para Auditoria de Sistemas de Gestão)
-- Data: 2025-12-17
-- NOTA: Este script pode ser executado múltiplas vezes sem erro (idempotente)
-- =============================================================================

-- =============================================================================
-- PARTE 1: ATUALIZAR TABELA audits (adicionar campos ISO 19011)
-- =============================================================================

-- Adicionar campo objectives (objetivos da auditoria)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audits' AND column_name = 'objectives'
  ) THEN
    ALTER TABLE audits ADD COLUMN objectives text;
    COMMENT ON COLUMN audits.objectives IS 'Objetivos específicos da auditoria (ISO 19011: 5.5.2)';
  END IF;
END $$;

-- Adicionar campo criteria (critérios de auditoria - normas/documentos de referência)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audits' AND column_name = 'criteria'
  ) THEN
    ALTER TABLE audits ADD COLUMN criteria text;
    COMMENT ON COLUMN audits.criteria IS 'Critérios de auditoria - normas, políticas e documentos de referência (ISO 19011: 3.2)';
  END IF;
END $$;

-- Adicionar campo audit_type para categorização (interno, fornecedor, certificação)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audits' AND column_name = 'audit_type'
  ) THEN
    ALTER TABLE audits ADD COLUMN audit_type text 
      CHECK (audit_type IN ('internal', 'supplier', 'certification', 'process', 'product'));
    COMMENT ON COLUMN audits.audit_type IS 'Tipo de auditoria: internal, supplier, certification, process, product';
  END IF;
END $$;

-- Adicionar campo template_id para vincular ao template de checklist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audits' AND column_name = 'template_id'
  ) THEN
    -- A FK será adicionada depois que a tabela de templates existir
    ALTER TABLE audits ADD COLUMN template_id uuid;
    COMMENT ON COLUMN audits.template_id IS 'Template de checklist vinculado a esta auditoria';
  END IF;
END $$;

-- Garantir que scope suporte texto longo (alterar tipo se necessário)
-- Na maioria dos casos, text já suporta texto longo, mas vamos garantir
COMMENT ON COLUMN audits.scope IS 'Escopo da auditoria - áreas, processos e locais a serem auditados (ISO 19011: 5.5.2)';

-- Índice para audit_type
CREATE INDEX IF NOT EXISTS audits_audit_type_idx ON audits(audit_type);

-- =============================================================================
-- PARTE 2: CRIAR TABELA audit_checklist_templates
-- Templates de questionários reutilizáveis
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_checklist_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES company_info(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  -- Metadados do template
  category text, -- Ex: "ISO 9001", "ISO 14001", "5S", "Fornecedores"
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS audit_checklist_templates_company_id_idx ON audit_checklist_templates(company_id);
CREATE INDEX IF NOT EXISTS audit_checklist_templates_category_idx ON audit_checklist_templates(category);
CREATE INDEX IF NOT EXISTS audit_checklist_templates_is_active_idx ON audit_checklist_templates(is_active);

-- Comentários
COMMENT ON TABLE audit_checklist_templates IS 'Templates de checklist de auditoria reutilizáveis';
COMMENT ON COLUMN audit_checklist_templates.name IS 'Nome do template (ex: Checklist ISO 9001:2015 - Cláusula 7)';
COMMENT ON COLUMN audit_checklist_templates.category IS 'Categoria do template (ex: ISO 9001, ISO 14001, 5S)';

-- Habilitar RLS
ALTER TABLE audit_checklist_templates ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PARTE 3: CRIAR TABELA audit_checklist_items
-- Perguntas/itens individuais do checklist
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_checklist_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid REFERENCES audit_checklist_templates(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  help_text text, -- Dicas/orientações para o auditor
  category text, -- Agrupamento dentro do template (ex: "Liderança", "Operação", "Documentação")
  iso_clause text, -- Referência da cláusula ISO (ex: "7.1.4", "8.5.1")
  order_index integer DEFAULT 0, -- Ordem de exibição
  is_required boolean DEFAULT true, -- Se o item é obrigatório na auditoria
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS audit_checklist_items_template_id_idx ON audit_checklist_items(template_id);
CREATE INDEX IF NOT EXISTS audit_checklist_items_category_idx ON audit_checklist_items(category);
CREATE INDEX IF NOT EXISTS audit_checklist_items_order_idx ON audit_checklist_items(template_id, order_index);

-- Comentários
COMMENT ON TABLE audit_checklist_items IS 'Itens/perguntas do checklist de auditoria';
COMMENT ON COLUMN audit_checklist_items.question IS 'Pergunta ou item a ser verificado pelo auditor';
COMMENT ON COLUMN audit_checklist_items.help_text IS 'Dicas e orientações para auxiliar o auditor na verificação';
COMMENT ON COLUMN audit_checklist_items.category IS 'Categoria para agrupamento visual (ex: Liderança, Operação)';
COMMENT ON COLUMN audit_checklist_items.iso_clause IS 'Referência à cláusula ISO correspondente (ex: 7.1.4)';

-- Habilitar RLS
ALTER TABLE audit_checklist_items ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PARTE 4: CRIAR TABELA audit_checklist_responses
-- Respostas de uma auditoria específica
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_checklist_responses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id uuid REFERENCES audits(id) ON DELETE CASCADE NOT NULL,
  item_id uuid REFERENCES audit_checklist_items(id) ON DELETE CASCADE NOT NULL,
  -- Status da verificação
  status text NOT NULL CHECK (status IN ('compliant', 'non_compliant', 'not_applicable', 'pending')),
  -- Evidências
  evidence_text text, -- Descrição da evidência ou descrição da não conformidade
  evidence_url text, -- URL para arquivo de evidência (foto, documento, etc.)
  -- Metadados
  notes text, -- Notas adicionais do auditor
  verified_by uuid REFERENCES auth.users(id), -- Auditor que verificou
  verified_at timestamp with time zone, -- Data/hora da verificação
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Garantir que cada item só tenha uma resposta por auditoria
  CONSTRAINT unique_audit_item_response UNIQUE (audit_id, item_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS audit_checklist_responses_audit_id_idx ON audit_checklist_responses(audit_id);
CREATE INDEX IF NOT EXISTS audit_checklist_responses_item_id_idx ON audit_checklist_responses(item_id);
CREATE INDEX IF NOT EXISTS audit_checklist_responses_status_idx ON audit_checklist_responses(status);
CREATE INDEX IF NOT EXISTS audit_checklist_responses_verified_by_idx ON audit_checklist_responses(verified_by);

-- Comentários
COMMENT ON TABLE audit_checklist_responses IS 'Respostas do checklist para cada auditoria executada';
COMMENT ON COLUMN audit_checklist_responses.status IS 'Status da verificação: compliant (conforme), non_compliant (não conforme), not_applicable (N/A), pending (pendente)';
COMMENT ON COLUMN audit_checklist_responses.evidence_text IS 'Descrição textual da evidência - OBRIGATÓRIO se status = non_compliant';
COMMENT ON COLUMN audit_checklist_responses.evidence_url IS 'URL para arquivo de evidência (foto, documento, gravação)';

-- Habilitar RLS
ALTER TABLE audit_checklist_responses ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PARTE 5: ADICIONAR FK DE template_id NA TABELA audits
-- =============================================================================

-- Adicionar a constraint FK (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'audits_template_id_fkey' 
    AND table_name = 'audits'
  ) THEN
    ALTER TABLE audits 
      ADD CONSTRAINT audits_template_id_fkey 
      FOREIGN KEY (template_id) 
      REFERENCES audit_checklist_templates(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- =============================================================================
-- PARTE 6: LIMPAR POLÍTICAS RLS EXISTENTES (para evitar duplicação)
-- =============================================================================

-- Templates
DROP POLICY IF EXISTS "Templates viewable by company members" ON audit_checklist_templates;
DROP POLICY IF EXISTS "Templates insertable by company members" ON audit_checklist_templates;
DROP POLICY IF EXISTS "Templates updatable by company members" ON audit_checklist_templates;
DROP POLICY IF EXISTS "Templates deletable by company members" ON audit_checklist_templates;
DROP POLICY IF EXISTS "Super admin access templates" ON audit_checklist_templates;

-- Items
DROP POLICY IF EXISTS "Items viewable by company members" ON audit_checklist_items;
DROP POLICY IF EXISTS "Items insertable by company members" ON audit_checklist_items;
DROP POLICY IF EXISTS "Items updatable by company members" ON audit_checklist_items;
DROP POLICY IF EXISTS "Items deletable by company members" ON audit_checklist_items;
DROP POLICY IF EXISTS "Super admin access items" ON audit_checklist_items;

-- Responses
DROP POLICY IF EXISTS "Responses viewable by company members" ON audit_checklist_responses;
DROP POLICY IF EXISTS "Responses insertable by company members" ON audit_checklist_responses;
DROP POLICY IF EXISTS "Responses updatable by company members" ON audit_checklist_responses;
DROP POLICY IF EXISTS "Responses deletable by company members" ON audit_checklist_responses;
DROP POLICY IF EXISTS "Super admin access responses" ON audit_checklist_responses;
DROP POLICY IF EXISTS "Auditor access responses" ON audit_checklist_responses;

-- =============================================================================
-- PARTE 7: POLÍTICAS RLS - audit_checklist_templates
-- =============================================================================

-- Membros da empresa podem visualizar templates da sua empresa
CREATE POLICY "Templates viewable by company members" ON audit_checklist_templates
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Membros da empresa podem inserir templates
CREATE POLICY "Templates insertable by company members" ON audit_checklist_templates
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Membros da empresa podem atualizar templates
CREATE POLICY "Templates updatable by company members" ON audit_checklist_templates
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Membros da empresa podem deletar templates
CREATE POLICY "Templates deletable by company members" ON audit_checklist_templates
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Super Admin tem acesso total
CREATE POLICY "Super admin access templates" ON audit_checklist_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
  );

-- =============================================================================
-- PARTE 8: POLÍTICAS RLS - audit_checklist_items
-- Acesso via template -> company_id
-- =============================================================================

-- Membros da empresa podem visualizar itens via template
CREATE POLICY "Items viewable by company members" ON audit_checklist_items
  FOR SELECT USING (
    template_id IN (
      SELECT id FROM audit_checklist_templates 
      WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Membros da empresa podem inserir itens
CREATE POLICY "Items insertable by company members" ON audit_checklist_items
  FOR INSERT WITH CHECK (
    template_id IN (
      SELECT id FROM audit_checklist_templates 
      WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Membros da empresa podem atualizar itens
CREATE POLICY "Items updatable by company members" ON audit_checklist_items
  FOR UPDATE USING (
    template_id IN (
      SELECT id FROM audit_checklist_templates 
      WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Membros da empresa podem deletar itens
CREATE POLICY "Items deletable by company members" ON audit_checklist_items
  FOR DELETE USING (
    template_id IN (
      SELECT id FROM audit_checklist_templates 
      WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Super Admin tem acesso total
CREATE POLICY "Super admin access items" ON audit_checklist_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
  );

-- =============================================================================
-- PARTE 9: POLÍTICAS RLS - audit_checklist_responses
-- Acesso via audit -> company_id
-- =============================================================================

-- Membros da empresa podem visualizar respostas via auditoria
CREATE POLICY "Responses viewable by company members" ON audit_checklist_responses
  FOR SELECT USING (
    audit_id IN (
      SELECT id FROM audits 
      WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Membros da empresa podem inserir respostas
CREATE POLICY "Responses insertable by company members" ON audit_checklist_responses
  FOR INSERT WITH CHECK (
    audit_id IN (
      SELECT id FROM audits 
      WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Membros da empresa podem atualizar respostas
CREATE POLICY "Responses updatable by company members" ON audit_checklist_responses
  FOR UPDATE USING (
    audit_id IN (
      SELECT id FROM audits 
      WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Membros da empresa podem deletar respostas
CREATE POLICY "Responses deletable by company members" ON audit_checklist_responses
  FOR DELETE USING (
    audit_id IN (
      SELECT id FROM audits 
      WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Super Admin tem acesso total
CREATE POLICY "Super admin access responses" ON audit_checklist_responses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
  );

-- Auditor externo pode gerenciar respostas de auditorias a ele designadas
CREATE POLICY "Auditor access responses" ON audit_checklist_responses
  FOR ALL USING (
    audit_id IN (
      SELECT a.id FROM audits a
      INNER JOIN audit_assignments aa ON aa.company_id = a.company_id
      WHERE aa.auditor_id = auth.uid()
      AND aa.status IN ('active', 'em_andamento', 'agendada')
      AND aa.start_date <= current_date
      AND (aa.end_date IS NULL OR aa.end_date >= current_date)
    )
  );

-- =============================================================================
-- PARTE 10: TRIGGERS PARA updated_at
-- =============================================================================

-- Trigger para audit_checklist_templates
CREATE OR REPLACE FUNCTION update_audit_checklist_templates_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_checklist_templates_updated_at_trigger ON audit_checklist_templates;
CREATE TRIGGER audit_checklist_templates_updated_at_trigger
  BEFORE UPDATE ON audit_checklist_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_audit_checklist_templates_updated_at();

-- Trigger para audit_checklist_items
CREATE OR REPLACE FUNCTION update_audit_checklist_items_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_checklist_items_updated_at_trigger ON audit_checklist_items;
CREATE TRIGGER audit_checklist_items_updated_at_trigger
  BEFORE UPDATE ON audit_checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_audit_checklist_items_updated_at();

-- Trigger para audit_checklist_responses
CREATE OR REPLACE FUNCTION update_audit_checklist_responses_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_checklist_responses_updated_at_trigger ON audit_checklist_responses;
CREATE TRIGGER audit_checklist_responses_updated_at_trigger
  BEFORE UPDATE ON audit_checklist_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_audit_checklist_responses_updated_at();

-- =============================================================================
-- PARTE 11: VIEW DE PROGRESSO DE AUDITORIA
-- =============================================================================

DROP VIEW IF EXISTS audit_checklist_progress;

CREATE VIEW audit_checklist_progress AS
SELECT 
  a.id AS audit_id,
  a.company_id,
  a.scope,
  a.audit_type,
  a.status AS audit_status,
  t.id AS template_id,
  t.name AS template_name,
  COUNT(DISTINCT aci.id) AS total_items,
  COUNT(DISTINCT acr.id) AS answered_items,
  COUNT(DISTINCT acr.id) FILTER (WHERE acr.status = 'compliant') AS compliant_count,
  COUNT(DISTINCT acr.id) FILTER (WHERE acr.status = 'non_compliant') AS non_compliant_count,
  COUNT(DISTINCT acr.id) FILTER (WHERE acr.status = 'not_applicable') AS na_count,
  CASE 
    WHEN COUNT(DISTINCT aci.id) = 0 THEN 0
    ELSE ROUND((COUNT(DISTINCT acr.id)::numeric / COUNT(DISTINCT aci.id)::numeric) * 100)
  END AS progress_percentage
FROM audits a
LEFT JOIN audit_checklist_templates t ON t.id = a.template_id
LEFT JOIN audit_checklist_items aci ON aci.template_id = t.id
LEFT JOIN audit_checklist_responses acr ON acr.audit_id = a.id AND acr.item_id = aci.id
GROUP BY a.id, a.company_id, a.scope, a.audit_type, a.status, t.id, t.name;

COMMENT ON VIEW audit_checklist_progress IS 'Visão consolidada do progresso de execução das auditorias';

-- =============================================================================
-- PARTE 12: DADOS DE EXEMPLO (Opcional - Template padrão ISO 9001)
-- Descomente para criar um template de exemplo
-- =============================================================================

/*
-- Template de exemplo: ISO 9001:2015 - Cláusula 7 (Apoio)
INSERT INTO audit_checklist_templates (company_id, name, description, category)
SELECT 
  id,
  'Checklist ISO 9001:2015 - Cláusula 7 (Apoio)',
  'Checklist para auditoria dos requisitos da Cláusula 7 da ISO 9001:2015',
  'ISO 9001'
FROM company_info
LIMIT 1
ON CONFLICT DO NOTHING;

-- Itens de exemplo
INSERT INTO audit_checklist_items (template_id, question, help_text, category, iso_clause, order_index)
SELECT 
  t.id,
  q.question,
  q.help_text,
  q.category,
  q.iso_clause,
  q.order_index
FROM audit_checklist_templates t,
(VALUES
  ('A organização determinou e provê os recursos necessários?', 'Verificar se há evidência de análise de recursos.', 'Recursos', '7.1.1', 1),
  ('A organização determinou e provê as pessoas necessárias?', 'Verificar organograma e descrições de cargo.', 'Pessoas', '7.1.2', 2),
  ('A organização determinou, provê e mantém a infraestrutura?', 'Verificar instalações, equipamentos e serviços de apoio.', 'Infraestrutura', '7.1.3', 3),
  ('O ambiente para operação de processos é adequado?', 'Considerar fatores sociais, psicológicos e físicos.', 'Ambiente', '7.1.4', 4),
  ('Existem recursos de monitoramento e medição adequados?', 'Verificar calibração e rastreabilidade.', 'Monitoramento', '7.1.5', 5),
  ('A organização determinou o conhecimento necessário?', 'Verificar como o conhecimento é mantido e disponibilizado.', 'Conhecimento', '7.1.6', 6),
  ('As pessoas são competentes com base em formação e experiência?', 'Verificar registros de competência e treinamento.', 'Competência', '7.2', 7),
  ('As pessoas estão conscientes da política e objetivos?', 'Entrevistar colaboradores sobre conscientização.', 'Conscientização', '7.3', 8),
  ('A comunicação interna e externa é eficaz?', 'Verificar canais e registros de comunicação.', 'Comunicação', '7.4', 9),
  ('A informação documentada está adequadamente controlada?', 'Verificar criação, atualização e controle de documentos.', 'Documentação', '7.5', 10)
) AS q(question, help_text, category, iso_clause, order_index)
WHERE t.name = 'Checklist ISO 9001:2015 - Cláusula 7 (Apoio)'
ON CONFLICT DO NOTHING;
*/

-- =============================================================================
-- MIGRAÇÃO CONCLUÍDA!
-- 
-- Resumo das alterações:
-- ✅ Coluna objectives adicionada em audits
-- ✅ Coluna criteria adicionada em audits
-- ✅ Coluna audit_type adicionada em audits
-- ✅ Coluna template_id adicionada em audits
-- ✅ Tabela audit_checklist_templates criada
-- ✅ Tabela audit_checklist_items criada
-- ✅ Tabela audit_checklist_responses criada
-- ✅ Políticas RLS configuradas para todas as tabelas
-- ✅ Triggers de updated_at configurados
-- ✅ View audit_checklist_progress criada
--
-- Próximos passos (Frontend):
-- 1. Atualizar types.ts com os novos tipos
-- 2. Modificar AuditsPage para usar os novos campos
-- 3. Criar interface de execução no AuditorPortal
-- =============================================================================
