-- Tabela de Fornecedores (Suppliers)
-- ISO 9001:2015 - 8.4 Controle de Processos Externos

create table if not exists public.suppliers (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.company_info(id) on delete cascade not null,
  name text not null,
  cnpj text,
  email text,
  phone text,
  category text not null, -- Ex: 'Matéria Prima', 'Serviços', 'Transporte', 'TI/Hardware', 'Logística'
  status text default 'em_analise' check (status in ('homologado', 'em_analise', 'bloqueado')),
  iqf_score numeric(5,2) default 0 check (iqf_score >= 0 and iqf_score <= 100),
  last_evaluation date,
  blocked_reason text, -- Motivo do bloqueio (se status = 'bloqueado')
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índices para otimizar consultas
create index if not exists idx_suppliers_company_id on public.suppliers(company_id);
create index if not exists idx_suppliers_status on public.suppliers(status);
create index if not exists idx_suppliers_iqf_score on public.suppliers(iqf_score);

-- Trigger para atualizar updated_at
create or replace function update_suppliers_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists suppliers_updated_at on public.suppliers;
create trigger suppliers_updated_at
  before update on public.suppliers
  for each row
  execute function update_suppliers_updated_at();

-- Enable RLS
alter table public.suppliers enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Suppliers viewable by company members" on public.suppliers;
drop policy if exists "Suppliers insertable by company members" on public.suppliers;
drop policy if exists "Suppliers updatable by company members" on public.suppliers;
drop policy if exists "Suppliers deletable by company members" on public.suppliers;

-- RLS Policies
create policy "Suppliers viewable by company members"
  on public.suppliers for select
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Suppliers insertable by company members"
  on public.suppliers for insert
  with check (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Suppliers updatable by company members"
  on public.suppliers for update
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Suppliers deletable by company members"
  on public.suppliers for delete
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );
