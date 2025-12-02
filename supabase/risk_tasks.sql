-- Tabela para tarefas de ação de riscos/oportunidades
create table if not exists risk_tasks (
  id uuid default gen_random_uuid() primary key,
  risk_id uuid references risks_opportunities(id) on delete cascade not null,
  description text not null,
  responsible_id uuid references profiles(id), -- Quem vai fazer
  deadline date, -- Prazo
  status text default 'pending' check (status in ('pending', 'completed')),
  created_at timestamp with time zone default now()
);

-- RLS (replicar as mesmas regras da tabela risks_opportunities)
alter table risk_tasks enable row level security;

create policy "Risk tasks viewable by company" on risk_tasks for select using (
  risk_id in (select id from risks_opportunities where company_id in (select company_id from profiles where id = auth.uid()))
);

create policy "Risk tasks insertable by company" on risk_tasks for insert with check (
  risk_id in (select id from risks_opportunities where company_id in (select company_id from profiles where id = auth.uid()))
);

create policy "Risk tasks updatable by company" on risk_tasks for update using (
  risk_id in (select id from risks_opportunities where company_id in (select company_id from profiles where id = auth.uid()))
);

create policy "Risk tasks deletable by company" on risk_tasks for delete using (
  risk_id in (select id from risks_opportunities where company_id in (select company_id from profiles where id = auth.uid()))
);

-- View para facilitar consultas com join
create or replace view risk_tasks_with_responsible as
select 
  rt.*,
  p.full_name as responsible_name
from risk_tasks rt
left join profiles p on rt.responsible_id = p.id;
