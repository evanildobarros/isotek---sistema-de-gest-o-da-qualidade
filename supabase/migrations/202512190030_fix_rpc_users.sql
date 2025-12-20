-- =============================================================================
-- MIGRAÇÃO: Corrigir RPC get_users_with_emails e Função Helper
-- Data: 2025-12-19
-- =============================================================================

-- 1. Garantir que a função is_super_admin existe
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_super_admin = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- 2. Recriar get_users_with_emails com robustez
DROP FUNCTION IF EXISTS get_users_with_emails();

CREATE OR REPLACE FUNCTION get_users_with_emails()
RETURNS table (
  id uuid,
  email varchar,
  full_name text,
  role text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  company_id uuid,
  company_name text
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verifica se é super admin
  IF is_super_admin() THEN
    -- Super Admin vê tudo
    RETURN QUERY
    SELECT 
      p.id,
      au.email::varchar,
      p.full_name,
      p.role,
      p.created_at,
      au.last_sign_in_at,
      p.company_id,
      c.name as company_name
    FROM profiles p
    JOIN auth.users au ON p.id = au.id
    LEFT JOIN company_info c ON p.company_id = c.id
    ORDER BY p.created_at DESC;
  ELSE
    -- Usuário normal: vê apenas usuários da SUA empresa
    -- IMPORTANTE: Garante que só retorna se o usuário atual tiver uma company_id válida
    RETURN QUERY
    SELECT 
      p.id,
      au.email::varchar,
      p.full_name,
      p.role,
      p.created_at,
      au.last_sign_in_at,
      p.company_id,
      c.name as company_name
    FROM profiles p
    JOIN auth.users au ON p.id = au.id
    LEFT JOIN company_info c ON p.company_id = c.id
    WHERE p.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    ORDER BY p.created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_users_with_emails() TO authenticated;
