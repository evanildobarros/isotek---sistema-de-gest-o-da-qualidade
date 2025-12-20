-- =============================================================================
-- MIGRAÇÃO: Corrigir Tipos na RPC get_users_with_emails (Enum Role)
-- Data: 2025-12-19
-- =============================================================================

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
      p.role::text, -- Cast explícito de user_role para text
      p.created_at,
      au.last_sign_in_at,
      p.company_id,
      c.name as company_name
    FROM profiles p
    JOIN auth.users au ON p.id = au.id
    LEFT JOIN company_info c ON p.company_id = c.id
    ORDER BY p.created_at DESC;
  ELSE
    -- Alias estritos para evitar colisão com parâmetros de saída
    RETURN QUERY
    SELECT 
      p.id,
      au.email::varchar,
      p.full_name,
      p.role::text, -- Cast explícito de user_role para text
      p.created_at,
      au.last_sign_in_at,
      p.company_id,
      c.name as company_name
    FROM profiles p
    JOIN auth.users au ON p.id = au.id
    LEFT JOIN company_info c ON p.company_id = c.id
    WHERE p.company_id = (SELECT p2.company_id FROM profiles p2 WHERE p2.id = auth.uid())
    ORDER BY p.created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_users_with_emails() TO authenticated;
