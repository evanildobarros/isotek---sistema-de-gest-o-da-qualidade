-- Tabela de Treinamentos dos Colaboradores (Employee Trainings)
-- ISO 9001:2015 - 7.2 Competência & 7.3 Conscientização

create table if not exists public.employee_trainings (
  id uuid default uuid_generate_v4() primary key,
  employee_id uuid references public.employees(id) on delete cascade not null,
  training_name text not null, -- Nome do treinamento
  date_completed date not null, -- Data de realização
  expiration_date date, -- Data de validade (opcional)
  certificate_url text, -- URL do certificado no Storage
  notes text, -- Notas adicionais
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índices
create index if not exists idx_employee_trainings_employee_id on public.employee_trainings(employee_id);
create index if not exists idx_employee_trainings_expiration on public.employee_trainings(expiration_date);

-- Trigger para atualizar updated_at
create or replace function update_employee_trainings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists employee_trainings_updated_at on public.employee_trainings;
create trigger employee_trainings_updated_at
  before update on public.employee_trainings
  for each row
  execute function update_employee_trainings_updated_at();

-- View com status calculado automaticamente
create or replace view public.employee_trainings_with_status as
select 
  et.*,
  e.company_id,
  e.name as employee_name,
  case 
    when et.expiration_date is null then 'completed'
    when et.expiration_date < current_date then 'expired'
    when et.expiration_date <= (current_date + interval '30 days') then 'expiring_soon'
    else 'completed'
  end as status
from public.employee_trainings et
join public.employees e on e.id = et.employee_id;

-- Enable RLS
alter table public.employee_trainings enable row level security;

-- Drop existing policies
drop policy if exists "Employee trainings viewable by company members" on public.employee_trainings;
drop policy if exists "Employee trainings insertable by company members" on public.employee_trainings;
drop policy if exists "Employee trainings updatable by company members" on public.employee_trainings;
drop policy if exists "Employee trainings deletable by company members" on public.employee_trainings;

-- RLS Policies (acesso via company_id do employee)
create policy "Employee trainings viewable by company members"
  on public.employee_trainings for select
  using (
    employee_id in (
      select e.id from public.employees e
      join public.profiles p on p.company_id = e.company_id
      where p.id = auth.uid()
    )
  );

create policy "Employee trainings insertable by company members"
  on public.employee_trainings for insert
  with check (
    employee_id in (
      select e.id from public.employees e
      join public.profiles p on p.company_id = e.company_id
      where p.id = auth.uid()
    )
  );

create policy "Employee trainings updatable by company members"
  on public.employee_trainings for update
  using (
    employee_id in (
      select e.id from public.employees e
      join public.profiles p on p.company_id = e.company_id
      where p.id = auth.uid()
    )
  );

create policy "Employee trainings deletable by company members"
  on public.employee_trainings for delete
  using (
    employee_id in (
      select e.id from public.employees e
      join public.profiles p on p.company_id = e.company_id
      where p.id = auth.uid()
    )
  );

-- Configurar bucket para certificados (se ainda não existir)
-- Execute este código separadamente no Supabase Dashboard se necessário:
/*
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', true)
on conflict (id) do nothing;

-- RLS para o bucket certificates
drop policy if exists "Certificates readable by authenticated users" on storage.objects;
create policy "Certificates readable by authenticated users"
  on storage.objects for select
  using (bucket_id = 'certificates' and auth.role() = 'authenticated');

drop policy if exists "Certificates uploadable by company members" on storage.objects;
create policy "Certificates uploadable by company members"
  on storage.objects for insert
  with check (
    bucket_id = 'certificates' 
    and auth.role() = 'authenticated'
  );

drop policy if exists "Certificates deletable by company members" on storage.objects;
create policy "Certificates deletable by company members"
  on storage.objects for delete
  using (
    bucket_id = 'certificates' 
    and auth.role() = 'authenticated'
  );
*/
