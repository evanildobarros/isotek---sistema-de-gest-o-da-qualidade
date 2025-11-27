-- Tabela de Ações Corretivas (Corrective Actions)
-- ISO 9001:2015 - 10.1 Não Conformidade e Ação Corretiva

create table if not exists public.corrective_actions (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.company_info(id) on delete cascade not null,
  code text not null, -- RNC-2024-01
  origin text not null, -- Auditoria, Reclamação Cliente, Indicador
  description text not null, -- O problema identificado
  root_cause text, -- Análise de causa raiz (5 Porquês / Ishikawa)
  immediate_action text, -- Ação imediata/disposição
  deadline date not null,
  responsible_id uuid references public.profiles(id) not null,
  status text default 'open' check (status in ('open', 'root_cause_analysis', 'implementation', 'effectiveness_check', 'closed')),
  effectiveness_verified boolean, -- O problema voltou a ocorrer?
  effectiveness_notes text, -- Parecer do gestor
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela de Tarefas do Plano de Ação
create table if not exists public.corrective_action_tasks (
  id uuid default uuid_generate_v4() primary key,
  corrective_action_id uuid references public.corrective_actions(id) on delete cascade not null,
  description text not null, -- O que fazer
  responsible_id uuid references public.profiles(id) not null, -- Quem
  due_date date not null, -- Quando
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Comentários para documentação
comment on table public.corrective_actions is 'Registro de Não Conformidades (RNC) e Ações Corretivas (ISO 9001:2015 - 10.1)';
comment on column public.corrective_actions.status is 'open=Aberta, root_cause_analysis=Análise Causa, implementation=Implementação, effectiveness_check=Verificação, closed=Fechada';
comment on table public.corrective_action_tasks is 'Tarefas do plano de ação (PDCA - Do)';

-- Índices para otimizar consultas
create index if not exists idx_corrective_actions_company_id on public.corrective_actions(company_id);
create index if not exists idx_corrective_actions_status on public.corrective_actions(status);
create index if not exists idx_corrective_actions_deadline on public.corrective_actions(deadline);
create index if not exists idx_corrective_action_tasks_ca_id on public.corrective_action_tasks(corrective_action_id);

-- Trigger para atualizar updated_at
create or replace function update_corrective_actions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists corrective_actions_updated_at on public.corrective_actions;
create trigger corrective_actions_updated_at
  before update on public.corrective_actions
  for each row
  execute function update_corrective_actions_updated_at();

-- View com informações do responsável e tarefas
create or replace view public.corrective_actions_with_details as
select 
  ca.*,
  p.full_name as responsible_name,
  (
    select json_agg(
      json_build_object(
        'id', t.id,
        'description', t.description,
        'responsible_id', t.responsible_id,
        'responsible_name', tp.full_name,
        'due_date', t.due_date,
        'completed', t.completed,
        'completed_at', t.completed_at
      ) order by t.due_date
    )
    from public.corrective_action_tasks t
    left join public.profiles tp on tp.id = t.responsible_id
    where t.corrective_action_id = ca.id
  ) as tasks
from public.corrective_actions ca
left join public.profiles p on p.id = ca.responsible_id;

-- Enable RLS
alter table public.corrective_actions enable row level security;
alter table public.corrective_action_tasks enable row level security;

-- Drop existing policies
drop policy if exists "Corrective actions viewable by company members" on public.corrective_actions;
drop policy if exists "Corrective actions insertable by company members" on public.corrective_actions;
drop policy if exists "Corrective actions updatable by company members" on public.corrective_actions;
drop policy if exists "Corrective actions deletable by company members" on public.corrective_actions;

drop policy if exists "Corrective action tasks viewable by company members" on public.corrective_action_tasks;
drop policy if exists "Corrective action tasks insertable by company members" on public.corrective_action_tasks;
drop policy if exists "Corrective action tasks updatable by company members" on public.corrective_action_tasks;
drop policy if exists "Corrective action tasks deletable by company members" on public.corrective_action_tasks;

-- RLS Policies - Corrective Actions
create policy "Corrective actions viewable by company members"
  on public.corrective_actions for select
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Corrective actions insertable by company members"
  on public.corrective_actions for insert
  with check (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Corrective actions updatable by company members"
  on public.corrective_actions for update
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Corrective actions deletable by company members"
  on public.corrective_actions for delete
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

-- RLS Policies - Tasks
create policy "Corrective action tasks viewable by company members"
  on public.corrective_action_tasks for select
  using (
    corrective_action_id in (
      select id from public.corrective_actions where company_id in (
        select company_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy "Corrective action tasks insertable by company members"
  on public.corrective_action_tasks for insert
  with check (
    corrective_action_id in (
      select id from public.corrective_actions where company_id in (
        select company_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy "Corrective action tasks updatable by company members"
  on public.corrective_action_tasks for update
  using (
    corrective_action_id in (
      select id from public.corrective_actions where company_id in (
        select company_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy "Corrective action tasks deletable by company members"
  on public.corrective_action_tasks for delete
  using (
    corrective_action_id in (
      select id from public.corrective_actions where company_id in (
        select company_id from public.profiles where id = auth.uid()
      )
    )
  );
