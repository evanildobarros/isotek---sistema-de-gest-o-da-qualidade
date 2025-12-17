-- =============================================================================
-- FIX COMPLETO: Remover TODAS as políticas de profiles e recriar corretamente
-- Execute este script por PARTES se necessário
-- =============================================================================

-- PARTE 1: CRIAR FUNÇÃO HELPER PRIMEIRO (sem depender de RLS)
-- =============================================================================

create or replace function is_current_user_super_admin()
returns boolean as $$
declare
  is_super boolean;
begin
  select is_super_admin into is_super
  from profiles
  where id = auth.uid();
  
  return coalesce(is_super, false);
end;
$$ language plpgsql security definer stable;

grant execute on function is_current_user_super_admin() to authenticated;
grant execute on function is_current_user_super_admin() to anon;

-- PARTE 2: REMOVER TODAS AS POLÍTICAS DE PROFILES
-- =============================================================================

do $$
declare
  pol record;
begin
  for pol in 
    select policyname from pg_policies where tablename = 'profiles' and schemaname = 'public'
  loop
    execute format('drop policy if exists %I on profiles', pol.policyname);
    raise notice 'Dropped policy: %', pol.policyname;
  end loop;
end $$;

-- PARTE 3: CRIAR NOVAS POLÍTICAS SEM RECURSÃO
-- =============================================================================

-- Política 1: Qualquer usuário autenticado pode ver seu próprio perfil
create policy "View own profile" on profiles
  for select using (id = auth.uid());

-- Política 2: Super Admin pode ver todos (usando função SECURITY DEFINER)
create policy "Super admin view all" on profiles
  for select using (is_current_user_super_admin());

-- Política 3: Super Admin pode inserir
create policy "Super admin insert" on profiles
  for insert with check (is_current_user_super_admin());

-- Política 4: Super Admin pode atualizar todos
create policy "Super admin update all" on profiles
  for update using (is_current_user_super_admin());

-- Política 5: Usuário pode atualizar seu próprio perfil
create policy "Update own profile" on profiles
  for update using (id = auth.uid());

-- Política 6: Usuários podem ver perfis da mesma empresa
-- (usando função para evitar recursão)
create or replace function get_user_company_id()
returns uuid as $$
  select company_id from profiles where id = auth.uid();
$$ language sql security definer stable;

grant execute on function get_user_company_id() to authenticated;

create policy "View same company profiles" on profiles
  for select using (company_id = get_user_company_id());

-- PARTE 4: VERIFICAR
-- =============================================================================
-- Execute isso para ver as políticas criadas:
-- select * from pg_policies where tablename = 'profiles';
