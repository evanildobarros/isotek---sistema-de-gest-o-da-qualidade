-- Função para buscar usuários com emails (join entre profiles e auth.users)
-- Esta função usa SECURITY DEFINER para acessar auth.users

-- Remover TODAS as versões anteriores da função
do $$
declare
  r record;
begin
  for r in (
    select p.oid::regprocedure as func_signature
    from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where p.proname = 'get_users_with_emails'
    and n.nspname = 'public'
  ) loop
    execute 'drop function if exists ' || r.func_signature || ' cascade';
  end loop;
end $$;

-- Agora criar a função limpa
create function get_users_with_emails()
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
      p.created_at,
      au.last_sign_in_at,  -- Corrigido: usar au. em vez de p.
      p.company_id,
      c.name as company_name
    from profiles p
    join auth.users au on p.id = au.id
    left join company_info c on p.company_id = c.id
    order by p.created_at desc;
  else
    -- Usuário normal vê apenas da sua empresa
    return query
    select 
      p.id,
      au.email::varchar,
      p.full_name,
      p.role,
      p.created_at,
      au.last_sign_in_at,  -- Corrigido: usar au. em vez de p.
      p.company_id,
      c.name as company_name
    from profiles p
    join auth.users au on p.id = au.id
    left join company_info c on p.company_id = c.id
    where p.company_id = (select company_id from profiles where id = auth.uid())
    order by p.created_at desc;
  end if;
end;
$$ language plpgsql;

-- Garantir permissão de execução
grant execute on function get_users_with_emails to authenticated;
