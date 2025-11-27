-- Tabela de Histórico de Medições de KPIs (KPI Measurements)
-- ISO 9001:2015 - 9.1 Monitoramento, medição, análise e avaliação

create table if not exists public.kpi_measurements (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.company_info(id) on delete cascade not null,
  objective_id uuid references public.quality_objectives(id) on delete cascade not null,
  date date not null,
  value numeric not null,
  notes text, -- Análise crítica (obrigatória se meta não atingida)
  created_at timestamptz default now()
);

-- Tabela de Pesquisas de Satisfação do Cliente (Customer Satisfaction Surveys)
-- ISO 9001:2015 - 9.1.2 Satisfação do cliente

create table if not exists public.customer_satisfaction_surveys (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.company_info(id) on delete cascade not null,
  date date not null,
  client_name text not null,
  score integer not null check (score >= 0 and score <= 10), -- NPS style (0-10)
  feedback text,
  created_at timestamptz default now()
);

-- Comentários para documentação
comment on table public.kpi_measurements is 'Histórico de medições dos Objetivos da Qualidade (ISO 9001:2015 - 9.1.1)';
comment on table public.customer_satisfaction_surveys is 'Pesquisas de satisfação do cliente (ISO 9001:2015 - 9.1.2)';

-- Índices
create index if not exists idx_kpi_measurements_objective_id on public.kpi_measurements(objective_id);
create index if not exists idx_kpi_measurements_date on public.kpi_measurements(date);
create index if not exists idx_customer_surveys_company_id on public.customer_satisfaction_surveys(company_id);
create index if not exists idx_customer_surveys_date on public.customer_satisfaction_surveys(date);

-- Enable RLS
alter table public.kpi_measurements enable row level security;
alter table public.customer_satisfaction_surveys enable row level security;

-- Drop existing policies
drop policy if exists "KPI measurements viewable by company members" on public.kpi_measurements;
drop policy if exists "KPI measurements insertable by company members" on public.kpi_measurements;
drop policy if exists "KPI measurements updatable by company members" on public.kpi_measurements;
drop policy if exists "KPI measurements deletable by company members" on public.kpi_measurements;

drop policy if exists "Customer surveys viewable by company members" on public.customer_satisfaction_surveys;
drop policy if exists "Customer surveys insertable by company members" on public.customer_satisfaction_surveys;
drop policy if exists "Customer surveys updatable by company members" on public.customer_satisfaction_surveys;
drop policy if exists "Customer surveys deletable by company members" on public.customer_satisfaction_surveys;

-- RLS Policies - KPI Measurements
create policy "KPI measurements viewable by company members"
  on public.kpi_measurements for select
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "KPI measurements insertable by company members"
  on public.kpi_measurements for insert
  with check (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "KPI measurements updatable by company members"
  on public.kpi_measurements for update
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "KPI measurements deletable by company members"
  on public.kpi_measurements for delete
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

-- RLS Policies - Customer Surveys
create policy "Customer surveys viewable by company members"
  on public.customer_satisfaction_surveys for select
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Customer surveys insertable by company members"
  on public.customer_satisfaction_surveys for insert
  with check (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Customer surveys updatable by company members"
  on public.customer_satisfaction_surveys for update
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Customer surveys deletable by company members"
  on public.customer_satisfaction_surveys for delete
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );
