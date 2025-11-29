-- ================================================
-- Adicionar Política RLS para UPDATE em company_info
-- ================================================
-- Este script permite que usuários da empresa atualizem
-- as informações de assinatura da sua própria empresa

-- Primeiro, verificar se RLS está habilitado
alter table company_info enable row level security;

-- Remover política antiga de update se existir
drop policy if exists "Company updatable by members" on company_info;
drop policy if exists "Companies are updatable by members" on company_info;
drop policy if exists "Company info updatable by company members" on company_info;

-- Criar nova política de UPDATE
-- Nota: Assumindo que profiles tem id (PK) que corresponde ao auth.uid()
create policy "Company info updatable by company members" on company_info
  for update
  using (
    id in (
      select company_id 
      from profiles 
      where id = auth.uid()
    )
  )
  with check (
    id in (
      select company_id 
      from profiles 
      where id = auth.uid()
    )
  );

-- Verificar políticas existentes
select schemaname, tablename, policyname, permissive, roles, cmd, qual 
from pg_policies 
where tablename = 'company_info';
