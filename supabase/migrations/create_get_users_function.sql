-- =============================================================================
-- Criar função get_users_with_emails (versão simplificada)
-- =============================================================================

-- Remover versões anteriores
drop function if exists get_users_with_emails() cascade;

-- Função helper is_super_admin (se não existir)
create or replace function is_super_admin()
returns boolean as $$
  select coalesce(
    (select is_super_admin from profiles where id = auth.uid()),
    false
  );
$$ language sql security definer stable;

grant execute on function is_super_admin() to authenticated;

-- Criar a função para buscar usuários com emails
create or replace function get_users_with_emails()
returns table (
  id uuid,
  email varchar,
  full_name text,
  role text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  company_id uuid,
  company_name text
)
security definer
set search_path = public
as $$
begin
  -- Verifica se o usuário é super admin
  if is_super_admin() then
    -- Super Admin vê tudo
    return query
    select 
      p.id,
      au.email::varchar,
      p.full_name,
      p.role,
      au.created_at,
      au.last_sign_in_at,
      p.company_id,
      c.name as company_name
    from profiles p
    join auth.users au on p.id = au.id
    left join company_info c on p.company_id = c.id
    order by au.created_at desc;
  else
    -- Usuário normal vê apenas da sua empresa
    return query
    select 
      p.id,
      au.email::varchar,
      p.full_name,
      p.role,
      au.created_at,
      au.last_sign_in_at,
      p.company_id,
      c.name as company_name
    from profiles p
    join auth.users au on p.id = au.id
    left join company_info c on p.company_id = c.id
    where p.company_id = (select company_id from profiles where id = auth.uid())
    order by au.created_at desc;
  end if;
end;
$$ language plpgsql;

-- Garantir permissões
grant execute on function get_users_with_emails to authenticated;
