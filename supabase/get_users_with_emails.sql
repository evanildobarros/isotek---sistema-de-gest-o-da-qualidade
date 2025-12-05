-- Função para buscar usuários com seus emails (join entre profiles e auth.users)
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
as $$
begin
  -- Verifica se o usuário é super admin
  if exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.is_super_admin = true
  ) then
    -- Super Admin vê tudo
    return query
    select 
      p.id,
      au.email::varchar,
      p.full_name,
      p.role,
      p.created_at,
      p.last_sign_in_at,
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
      p.last_sign_in_at,
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
