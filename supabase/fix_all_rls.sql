-- =============================================
-- SCRIPT CONSOLIDADO DE CORREÇÃO DE RLS
-- Execute este script no Supabase SQL Editor
-- =============================================

-- 1. FUNÇÃO SEGURA para verificar Super Admin (evita recursão)
-- Usando CREATE OR REPLACE para não afetar políticas existentes
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_super_admin from profiles where id = auth.uid()),
    false
  );
$$;

-- 2. LIMPAR TODAS AS POLÍTICAS PROBLEMÁTICAS de PROFILES
drop policy if exists "Users can view their own profile" on profiles;
drop policy if exists "Users can view profiles from same company" on profiles;
drop policy if exists "Super admins can view all profiles" on profiles;
drop policy if exists "Profiles are viewable by users who created them." on profiles;
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Enable read access for all users" on profiles;
drop policy if exists "profiles_select_policy" on profiles;
drop policy if exists "Allow authenticated users to select profiles" on profiles;

-- 3. CRIAR POLÍTICA SIMPLES E FUNCIONAL para PROFILES
-- Instead of complex policies, use a single simple policy
create policy "profiles_read_all_authenticated"
on profiles for select
to authenticated
using (true); -- Todos os usuários autenticados podem ler perfis

-- 4. CORRIGIR RLS de UNITS (se existir)
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'units') then
    -- Remover políticas antigas de units
    execute 'drop policy if exists "units_company_access" on units';
    execute 'drop policy if exists "Enable read for users based on company" on units';
    execute 'drop policy if exists "Units are accessible by company members" on units';
    
    -- Criar política simples para units
    execute 'create policy "units_read_authenticated" on units for select to authenticated using (true)';
  end if;
end $$;

-- 5. CORRIGIR RLS de COMPANY_INFO (se existir)
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'company_info') then
    execute 'drop policy if exists "company_read_own" on company_info';
    execute 'drop policy if exists "Enable read for users based on company" on company_info';
    execute 'drop policy if exists "Companies are accessible by members" on company_info';
    
    execute 'create policy "company_read_authenticated" on company_info for select to authenticated using (true)';
  end if;
end $$;

-- 6. GARANTIR PERMISSÕES BÁSICAS
grant execute on function public.is_super_admin to authenticated;
grant select on profiles to authenticated;

-- 7. PROMOVER EVANILDO A SUPER ADMIN
update profiles
set is_super_admin = true, role = 'admin'
where id = (select id from auth.users where email = 'evanildobarros@gmail.com');

-- 8. VERIFICAÇÃO FINAL
select 
  p.id,
  u.email,
  p.full_name,
  p.role,
  p.is_super_admin,
  p.company_id
from profiles p
join auth.users u on p.id = u.id
where u.email = 'evanildobarros@gmail.com';
