-- =============================================================================
-- MIGRAÇÃO: Políticas RLS para Profiles - Super Admin
-- Descrição: Permite que Super Admins insiram e atualizem qualquer perfil
-- Data: 2025-12-16
-- =============================================================================

-- =============================================================================
-- PARTE 1: POLÍTICAS PARA profiles (Super Admin INSERT/UPDATE)
-- =============================================================================

-- Drop políticas antigas conflitantes
drop policy if exists "Super admins can insert profiles" on profiles;
drop policy if exists "Super admins can update profiles" on profiles;
drop policy if exists "Super admins can manage all profiles" on profiles;

-- Super Admins podem inserir qualquer perfil
create policy "Super admins can insert profiles" on profiles
  for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_super_admin = true
    )
  );

-- Super Admins podem atualizar qualquer perfil
create policy "Super admins can update profiles" on profiles
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_super_admin = true
    )
  );

-- Super Admins podem visualizar todos os perfis
drop policy if exists "Super admins can view all profiles" on profiles;
create policy "Super admins can view all profiles" on profiles
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_super_admin = true
    )
  );

-- =============================================================================
-- PARTE 2: GARANTIR QUE audit_assignments EXISTE
-- (Já deve existir de migrações anteriores, mas verificamos)
-- =============================================================================

-- Verificar e criar se não existir
do $$
begin
  if not exists (
    select from information_schema.tables 
    where table_schema = 'public' 
    and table_name = 'audit_assignments'
  ) then
    create table audit_assignments (
      id uuid default gen_random_uuid() primary key,
      auditor_id uuid references auth.users(id) on delete cascade not null,
      company_id uuid references company_info(id) on delete cascade not null,
      start_date date not null default current_date,
      end_date date,
      status text not null default 'agendada' check (status in ('agendada', 'em_andamento', 'concluida', 'cancelada')),
      notes text,
      created_by uuid references auth.users(id),
      created_at timestamp with time zone default timezone('utc'::text, now()) not null,
      updated_at timestamp with time zone default timezone('utc'::text, now()) not null
    );
    
    alter table audit_assignments enable row level security;
    
    raise notice 'Tabela audit_assignments criada.';
  else
    raise notice 'Tabela audit_assignments já existe.';
  end if;
end $$;

-- =============================================================================
-- PARTE 3: GARANTIR POLÍTICAS RLS PARA audit_assignments
-- =============================================================================

-- Super Admins podem gerenciar todos os vínculos
drop policy if exists "Super admins full access to audit_assignments" on audit_assignments;
create policy "Super admins full access to audit_assignments" on audit_assignments
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_super_admin = true
    )
  );

-- Auditores podem ver seus próprios vínculos
drop policy if exists "Auditors can view own assignments" on audit_assignments;
create policy "Auditors can view own assignments" on audit_assignments
  for select using (auditor_id = auth.uid());

-- Empresa pode ver vínculos de auditores com ela
drop policy if exists "Company can view their auditors" on audit_assignments;
create policy "Company can view their auditors" on audit_assignments
  for select using (
    company_id in (select company_id from profiles where id = auth.uid())
  );

-- =============================================================================
-- ROLLBACK (descomente se necessário reverter)
-- =============================================================================
-- drop policy if exists "Super admins can insert profiles" on profiles;
-- drop policy if exists "Super admins can update profiles" on profiles;
-- drop policy if exists "Super admins can view all profiles" on profiles;
-- drop policy if exists "Super admins full access to audit_assignments" on audit_assignments;
-- drop policy if exists "Auditors can view own assignments" on audit_assignments;
-- drop policy if exists "Company can view their auditors" on audit_assignments;
