-- =============================================================================
-- MIGRAÇÃO: Nuke & Fix Policies (Remover todas e recriar)
-- Data: 2025-12-19
-- =============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. LOOP para remover TODAS as policies da tabela profiles
    -- Isso garante que nenhuma policy antiga/recursiva sobreviva, independente do nome
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', r.policyname);
    END LOOP;
END $$;

-- 2. Recriar Funções Seguras (Garantia)
CREATE OR REPLACE FUNCTION public.get_user_role_safe(user_id uuid)
RETURNS text AS $$
BEGIN
  RETURN (SELECT role::text FROM profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS boolean AS $$
BEGIN
  RETURN (SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR is_super_admin = true)
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_role_safe(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role_safe(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_safe() TO service_role;

-- 3. Recriar Policies Otimizadas

-- Leitura: Aberta para autenticados (simples e sem recursão)
CREATE POLICY "Profiles Viewable by Authenticated" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);

-- Inserção: Apenas o próprio usuário (ao se cadastrar)
CREATE POLICY "Profiles Insertable by Self" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Atualização: Próprio usuário OU Admin (via função segura)
CREATE POLICY "Profiles Updatable by Self or Admin" 
ON profiles FOR UPDATE 
TO authenticated 
USING (
  auth.uid() = id
  OR 
  public.is_admin_safe()
);

-- Delete: Apenas Admin
CREATE POLICY "Profiles Deletable by Admin"
ON profiles FOR DELETE
TO authenticated
USING (
  public.is_admin_safe()
);
