-- ========================================
-- CORREÇÃO URGENTE: Multi-Tenancy Isolation
-- ========================================
-- PROBLEMA: Usuários veem perfis de outras empresas
-- SOLUÇÃO: Row Level Security (RLS) na tabela profiles
-- ========================================

-- 0. CRIAR FUNÇÕES AUXILIARES (SECURITY DEFINER)
-- Necessário para evitar RECURSÃO INFINITA nas políticas
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 1. Habilitar RLS na tabela profiles (se ainda não estiver)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. REMOVER políticas antigas que podem estar vazando dados
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles visible only to same company members" ON public.profiles;

-- 3. CRIAR política de LEITURA (SELECT) - ISOLAMENTO POR EMPRESA
-- Regra: Um usuário só pode ver perfis da MESMA empresa
-- EXCEÇÃO: Super Admins podem ver TODOS os perfis (para gerenciar múltiplas empresas)
CREATE POLICY "Profiles visible only to same company members"
ON public.profiles
FOR SELECT
USING (
    -- Super Admins can see ALL profiles (using safe function)
    public.is_super_admin() = true
    OR
    -- Regular users can only see profiles from their own company (using safe function)
    company_id = public.get_user_company_id()
);

-- 4. CRIAR política de ATUALIZAÇÃO (UPDATE)
-- Regra: Usuário só pode atualizar SEU PRÓPRIO perfil
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 5. CRIAR política de INSERÇÃO (INSERT)
-- Regra: Usuário pode criar seu próprio perfil (durante signup)
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (id = auth.uid());

-- 6. CRIAR política de DELEÇÃO (DELETE)
-- Regra: Apenas o próprio usuário pode deletar seu perfil
-- OU admin da mesma empresa (opcional - comentado por segurança)
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (id = auth.uid());

-- ========================================
-- VERIFICAÇÃO DE SEGURANÇA
-- ========================================
-- Execute os comandos abaixo para confirmar que as políticas estão ativas:

-- Verifica se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';
-- Resultado esperado: rowsecurity = true

-- Lista todas as políticas ativas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';
-- Resultado esperado: 4 políticas (SELECT, UPDATE, INSERT, DELETE)
