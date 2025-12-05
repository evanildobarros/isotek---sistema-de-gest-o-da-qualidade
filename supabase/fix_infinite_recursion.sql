-- 1. Função segura para verificar se é super admin (quebra a recursão)
create or replace function public.is_super_admin()
returns boolean
language sql
security definer -- Executa com permissões do criador da função (admin), ignorando RLS do usuário
set search_path = public
stable
as $$
  select coalesce(
    (select is_super_admin from profiles where id = auth.uid()),
    false
  );
$$;

-- 2. Recriar as políticas da tabela profiles corretamente
alter table profiles enable row level security;

-- Remover políticas problemáticas
drop policy if exists "Users can view their own profile" on profiles;
drop policy if exists "Users can view profiles from same company" on profiles;
drop policy if exists "Super admins can view all profiles" on profiles;
drop policy if exists "Profiles are viewable by users who created them." on profiles;
drop policy if exists "Public profiles are viewable by everyone." on profiles;

-- Política 1: Usuário vê seu próprio perfil
create policy "Users can view their own profile"
on profiles for select
using ( auth.uid() = id );

-- Política 2: Usuário vê perfis da mesma empresa
create policy "Users can view profiles from same company"
on profiles for select
using (
  company_id in (
    select company_id from profiles where id = auth.uid()
  )
);

-- Política 3: Super Admin vê TUDO (usando a função segura)
create policy "Super admins can view all profiles"
on profiles for select
using ( is_super_admin() );

-- Garantir permissões
grant execute on function public.is_super_admin to authenticated;
grant select on profiles to authenticated;
