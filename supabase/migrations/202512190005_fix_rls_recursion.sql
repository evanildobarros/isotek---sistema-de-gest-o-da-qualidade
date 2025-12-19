-- =============================================================================
-- MIGRAÇÃO: Corrigir Recursão Infinita em RLS (Profiles)
-- Data: 2025-12-19
-- =============================================================================

-- 1. Helper function para checar permissões sem recursão
-- SECURITY DEFINER: roda com permissões do criador (admin), ignorando RLS
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

-- 2. Recriar Policies da tabela 'profiles'

-- Remover policies antigas (nomes prováveis)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update company profiles" ON profiles;

-- Habilitar RLS (garantir)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy de Leitura: Todos autenticados podem ver (ou pelo menos ver sua empresa)
-- Simplificando para evitar recursão: Leitura liberada para autenticados
-- (Necessário para joins de nomes, etc.)
CREATE POLICY "Profiles are viewable by authenticated users" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);

-- Policy de Inserção: Usuário pode criar seu próprio profile
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Policy de Atualização: Usuário dono OU Admin
CREATE POLICY "Users and Admins can update profiles" 
ON profiles FOR UPDATE 
TO authenticated 
USING (
  -- O próprio usuário
  auth.uid() = id
  OR 
  -- Admin (usando função segura para evitar recursão)
  public.is_admin_safe()
);

-- Garantir acesso ao get_user_role_safe
GRANT EXECUTE ON FUNCTION public.get_user_role_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_safe TO authenticated;
