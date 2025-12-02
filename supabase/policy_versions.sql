-- Controle de Versionamento da Política da Qualidade (ISO 9001: 7.5)
-- Este script cria a tabela para histórico de versões da política

-- Criar tabela de versões
create table if not exists policy_versions (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references company_info(id) on delete cascade not null,
  content text not null,
  version text not null,
  approval_date date,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

-- Criar índices para melhor performance
create index if not exists idx_policy_versions_company on policy_versions(company_id);
create index if not exists idx_policy_versions_created_at on policy_versions(created_at desc);

-- Habilitar RLS (Row Level Security)
alter table policy_versions enable row level security;

-- Política: Visualização apenas para membros da empresa
create policy "Versions viewable by company members" 
  on policy_versions
  for select 
  using (
    company_id in (
      select company_id 
      from profiles 
      where id = auth.uid()
    )
  );

-- Política: Inserção apenas para membros da empresa
create policy "Versions insertable by company members" 
  on policy_versions
  for insert 
  with check (
    company_id in (
      select company_id 
      from profiles 
      where id = auth.uid()
    )
  );

-- View para facilitar consultas com informações do criador
create or replace view policy_versions_with_creator as
select 
  pv.*,
  p.full_name as created_by_name
from policy_versions pv
left join profiles p on pv.created_by = p.id;

-- Comentários na tabela
comment on table policy_versions is 'Histórico de versões da Política da Qualidade (ISO 9001: 7.5)';
comment on column policy_versions.content is 'Conteúdo da política nesta versão';
comment on column policy_versions.version is 'Número ou nome da versão (ex: 1.0, 2.0, Rev A)';
comment on column policy_versions.approval_date is 'Data de aprovação desta versão';
comment on column policy_versions.created_by is 'Usuário que salvou esta versão';
