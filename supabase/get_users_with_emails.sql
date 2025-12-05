-- Função RPC para buscar usuários com seus emails
-- Esta função retorna os perfis dos usuários junto com seus emails da tabela auth.users

CREATE OR REPLACE FUNCTION get_users_with_emails(p_company_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  company_id uuid,
  company_name text
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    au.email,
    p.full_name,
    p.role,
    p.created_at,
    au.last_sign_in_at,
    p.company_id,
    ci.name as company_name
  FROM profiles p
  INNER JOIN auth.users au ON au.id = p.id
  LEFT JOIN company_info ci ON ci.id = p.company_id
  WHERE p.company_id = p_company_id
  ORDER BY p.created_at DESC;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION get_users_with_emails(uuid) TO authenticated;
