-- =============================================================================
-- MIGRAÇÃO: Políticas RLS de Isolamento por Empresa
-- Descrição: Implementa Row Level Security para garantir privacidade de dados
-- Data: 2025-12-19
-- =============================================================================

-- =============================================================================
-- 1. POLÍTICAS PARA PROFILES
-- =============================================================================

-- Habilitar RLS (caso não esteja)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas que podem conflitar
DROP POLICY IF EXISTS "Users can view data from their company" ON profiles;
DROP POLICY IF EXISTS "Admins can update company profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles of same company" ON profiles;

-- Política 1: Usuários podem ver seu próprio perfil sempre
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Política 2: Usuários podem ver perfis da mesma empresa
-- Usamos uma subquery que evita recursão infinita ao filtrar pelo ID do usuário logado
CREATE POLICY "Users can view profiles of same company"
ON profiles FOR SELECT
USING (
  company_id = (
    SELECT p.company_id FROM profiles p WHERE p.id = auth.uid()
  )
);

-- Política 3: Administradores podem atualizar perfis da própria empresa
CREATE POLICY "Admins can update company profiles"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles admin_p
    WHERE admin_p.id = auth.uid()
    AND admin_p.company_id = profiles.company_id
    AND admin_p.role = 'admin'
  )
);

-- =============================================================================
-- 2. POLÍTICAS PARA DOCUMENTS
-- =============================================================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage documents of their company" ON documents;
DROP POLICY IF EXISTS "Users can view documents of their company" ON documents;

CREATE POLICY "Users access company documents"
ON documents FOR ALL
USING (
  company_id = (SELECT p.company_id FROM profiles p WHERE p.id = auth.uid())
)
WITH CHECK (
  company_id = (SELECT p.company_id FROM profiles p WHERE p.id = auth.uid())
);

-- =============================================================================
-- 3. POLÍTICAS PARA RISKS_OPPORTUNITIES
-- =============================================================================

ALTER TABLE risks_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users access company risks" ON risks_opportunities;

CREATE POLICY "Users access company risks"
ON risks_opportunities FOR ALL
USING (
  company_id = (SELECT p.company_id FROM profiles p WHERE p.id = auth.uid())
)
WITH CHECK (
  company_id = (SELECT p.company_id FROM profiles p WHERE p.id = auth.uid())
);

-- =============================================================================
-- 4. POLÍTICAS PARA NON_CONFORMITIES_PRODUCTS
-- =============================================================================

ALTER TABLE non_conformities_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users access company non_conformities" ON non_conformities_products;

CREATE POLICY "Users access company non_conformities"
ON non_conformities_products FOR ALL
USING (
  company_id = (SELECT p.company_id FROM profiles p WHERE p.id = auth.uid())
)
WITH CHECK (
  company_id = (SELECT p.company_id FROM profiles p WHERE p.id = auth.uid())
);

-- =============================================================================
-- COMENTÁRIOS E PERMISSÕES
-- =============================================================================

COMMENT ON POLICY "Users access company documents" ON documents IS 'Garante que usuários só acessem documentos da sua própria organização';
COMMENT ON POLICY "Users access company risks" ON risks_opportunities IS 'Garante que usuários só acessem riscos da sua própria organização';
COMMENT ON POLICY "Users access company non_conformities" ON non_conformities_products IS 'Garante que usuários só acessem não conformidades da sua própria organização';
