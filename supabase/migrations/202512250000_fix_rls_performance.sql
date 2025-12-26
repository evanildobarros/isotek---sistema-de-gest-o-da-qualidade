-- Migração: Fix RLS Performance and Recursion in Profiles
-- Descrição: Altera a política de visualização de perfis para usar metadados do JWT em vez de subqueries recursivas.

-- 1. Remover políitcas problemáticas existentes (ajustar nomes se necessário)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles of their own company" ON profiles;

-- 2. Criar nova política ultra-performante baseada em JWT metadata
-- Se o app injeta company_id no JWT, essa é a forma mais segura e rápida.
-- Caso contrário, usamos um filtro direto pelo ID do usuário autenticado.

CREATE POLICY "Profiles viewable by company members"
ON profiles
FOR SELECT
USING (
  -- Permite ver o próprio perfil
  auth.uid() = id
  OR 
  -- Permite ver perfis da mesma empresa usando o metadado do JWT para evitar recursão
  (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid = company_id
);

-- 3. Política para Super Admins (se necessário via JWT)
CREATE POLICY "Super Admins can view all profiles"
ON profiles
FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'is_super_admin')::boolean = true
);

-- Nota: Certifique-se de que o campo 'company_id' esteja presente no app_metadata ou user_metadata 
-- se optar por essa solução. Caso não esteja, a alternativa segura para evitar recursão é:
-- USING ( company_id IN (SELECT p.company_id FROM profiles p WHERE p.id = auth.uid()) ) 
-- Mas o Postgres às vezes otimiza mal essa subquery. A solução do JWT metadata é o padrão ouro do Supabase.
