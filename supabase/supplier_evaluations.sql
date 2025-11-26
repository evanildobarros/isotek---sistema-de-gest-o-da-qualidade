-- Tabela de Avaliações de Fornecedores (Supplier Evaluations)
-- ISO 9001:2015 - 8.4 Controle de Processos Externos

create table if not exists public.supplier_evaluations (
  id uuid default uuid_generate_v4() primary key,
  supplier_id uuid references public.suppliers(id) on delete cascade not null,
  evaluator_id uuid references auth.users(id) not null,
  evaluation_date date default current_date not null,
  criteria_quality numeric(4,2) not null check (criteria_quality >= 0 and criteria_quality <= 10),
  criteria_deadline numeric(4,2) not null check (criteria_deadline >= 0 and criteria_deadline <= 10),
  criteria_communication numeric(4,2) not null check (criteria_communication >= 0 and criteria_communication <= 10),
  final_score numeric(5,2) generated always as ((criteria_quality + criteria_deadline + criteria_communication) / 3) stored,
  comments text,
  created_at timestamptz default now()
);

-- Índices
create index if not exists idx_supplier_evaluations_supplier_id on public.supplier_evaluations(supplier_id);
create index if not exists idx_supplier_evaluations_date on public.supplier_evaluations(evaluation_date);

-- Função para atualizar o IQF Score do fornecedor baseado nas últimas 3 avaliações
create or replace function update_supplier_iqf()
returns trigger as $$
declare
  avg_score numeric;
begin
  -- Calcular média das últimas 3 avaliações (ou todas se houver menos de 3)
  select avg(final_score) * 10 into avg_score
  from (
    select final_score
    from public.supplier_evaluations
    where supplier_id = new.supplier_id
    order by evaluation_date desc, created_at desc
    limit 3
  ) recent_evals;

  -- Atualizar o IQF Score e a data da última avaliação
  update public.suppliers
  set 
    iqf_score = coalesce(avg_score, 0),
    last_evaluation = new.evaluation_date
  where id = new.supplier_id;

  return new;
end;
$$ language plpgsql;

-- Trigger para atualizar IQF automaticamente após nova avaliação
drop trigger if exists update_iqf_after_evaluation on public.supplier_evaluations;
create trigger update_iqf_after_evaluation
  after insert on public.supplier_evaluations
  for each row
  execute function update_supplier_iqf();

-- View com informações completas de avaliações (incluindo nomes)
create or replace view public.supplier_evaluations_with_details as
select 
  se.*,
  s.name as supplier_name,
  s.category as supplier_category,
  s.company_id,
  p.full_name as evaluator_name
from public.supplier_evaluations se
join public.suppliers s on s.id = se.supplier_id
left join public.profiles p on p.id = se.evaluator_id;

-- Enable RLS
alter table public.supplier_evaluations enable row level security;

-- Drop existing policies
drop policy if exists "Supplier evaluations viewable by company members" on public.supplier_evaluations;
drop policy if exists "Supplier evaluations insertable by company members" on public.supplier_evaluations;
drop policy if exists "Supplier evaluations updatable by company members" on public.supplier_evaluations;
drop policy if exists "Supplier evaluations deletable by company members" on public.supplier_evaluations;

-- RLS Policies (acesso via company_id do supplier)
create policy "Supplier evaluations viewable by company members"
  on public.supplier_evaluations for select
  using (
    supplier_id in (
      select s.id from public.suppliers s
      join public.profiles p on p.company_id = s.company_id
      where p.id = auth.uid()
    )
  );

create policy "Supplier evaluations insertable by company members"
  on public.supplier_evaluations for insert
  with check (
    supplier_id in (
      select s.id from public.suppliers s
      join public.profiles p on p.company_id = s.company_id
      where p.id = auth.uid()
    )
  );

create policy "Supplier evaluations updatable by company members"
  on public.supplier_evaluations for update
  using (
    supplier_id in (
      select s.id from public.suppliers s
      join public.profiles p on p.company_id = s.company_id
      where p.id = auth.uid()
    )
  );

create policy "Supplier evaluations deletable by company members"
  on public.supplier_evaluations for delete
  using (
    supplier_id in (
      select s.id from public.suppliers s
      join public.profiles p on p.company_id = s.company_id
      where p.id = auth.uid()
    )
  );
