-- Tabela de Partes Interessadas (Stakeholders)
create table if not exists public.stakeholders (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.company_info(id) not null,
  name text not null,
  type text not null, -- 'Interno' or 'Externo' (or specific types like 'Cliente', 'Fornecedor', etc.)
  needs text, -- Necessidades (Requisito mandatório)
  expectations text, -- Expectativas (Desejável)
  monitor_frequency text, -- Frequência de Monitoramento (ex: 'Mensal', 'Semestral', 'Anual')
  created_at timestamptz default now()
);

-- Ensure company_id exists (in case table existed without it)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stakeholders' AND column_name = 'company_id') THEN
        ALTER TABLE public.stakeholders ADD COLUMN company_id uuid references public.company_info(id);
    END IF;
END $$;

-- RLS Policies
alter table public.stakeholders enable row level security;

-- Drop policies if they exist to avoid errors when recreating
drop policy if exists "Stakeholders viewable by company members" on public.stakeholders;
drop policy if exists "Stakeholders insertable by company members" on public.stakeholders;
drop policy if exists "Stakeholders updatable by company members" on public.stakeholders;
drop policy if exists "Stakeholders deletable by company members" on public.stakeholders;

create policy "Stakeholders viewable by company members"
  on public.stakeholders for select
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Stakeholders insertable by company members"
  on public.stakeholders for insert
  with check (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Stakeholders updatable by company members"
  on public.stakeholders for update
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Stakeholders deletable by company members"
  on public.stakeholders for delete
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );
