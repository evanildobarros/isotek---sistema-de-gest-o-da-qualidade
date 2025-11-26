-- Tabela de Colaboradores (Employees)
-- ISO 9001:2015 - 7.2 Competência

create table if not exists public.employees (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.company_info(id) on delete cascade not null,
  name text not null,
  job_title text not null, -- Cargo
  department text, -- Departamento/Setor
  admission_date date not null, -- Data de Admissão
  status text default 'active' check (status in ('active', 'inactive')),
  user_id uuid references auth.users(id) on delete set null, -- Link opcional com usuário do sistema
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índice para otimizar consultas por empresa
create index if not exists idx_employees_company_id on public.employees(company_id);
create index if not exists idx_employees_status on public.employees(status);

-- Trigger para atualizar updated_at
create or replace function update_employees_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists employees_updated_at on public.employees;
create trigger employees_updated_at
  before update on public.employees
  for each row
  execute function update_employees_updated_at();

-- Enable RLS
alter table public.employees enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Employees viewable by company members" on public.employees;
drop policy if exists "Employees insertable by company members" on public.employees;
drop policy if exists "Employees updatable by company members" on public.employees;
drop policy if exists "Employees deletable by company members" on public.employees;

-- RLS Policies
create policy "Employees viewable by company members"
  on public.employees for select
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Employees insertable by company members"
  on public.employees for insert
  with check (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Employees updatable by company members"
  on public.employees for update
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Employees deletable by company members"
  on public.employees for delete
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );
