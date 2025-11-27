-- Tabela de Pedidos/Contratos (Sales Orders)
-- ISO 9001:2015 - 8.2 Comunicação com o Cliente e Análise Crítica de Requisitos

create table if not exists public.sales_orders (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.company_info(id) on delete cascade not null,
  code text not null, -- Número do pedido/contrato
  client_name text not null,
  description text not null, -- O que foi vendido (produto/serviço)
  delivery_deadline date not null,
  status text default 'pending_review' check (status in ('pending_review', 'approved', 'rejected', 'delivered')),
  review_notes text, -- Observações da análise crítica
  
  -- Checklist da análise crítica (ISO 8.2.3)
  requirements_defined boolean, -- Requisitos claramente definidos?
  has_capacity boolean, -- Empresa tem capacidade de cumprir?
  risks_considered boolean, -- Riscos foram considerados?
  
  reviewed_by uuid references public.profiles(id), -- Quem realizou a análise
  reviewed_at timestamptz, -- Quando foi analisado
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Comentários para documentação
comment on table public.sales_orders is 'Pedidos/Contratos com análise crítica de requisitos (ISO 9001:2015 - 8.2)';
comment on column public.sales_orders.status is 'pending_review=Aguardando Análise, approved=Aprovado, rejected=Rejeitado, delivered=Entregue';

-- Índices para otimizar consultas
create index if not exists idx_sales_orders_company_id on public.sales_orders(company_id);
create index if not exists idx_sales_orders_status on public.sales_orders(status);
create index if not exists idx_sales_orders_code on public.sales_orders(code);

-- Trigger para atualizar updated_at
create or replace function update_sales_orders_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists sales_orders_updated_at on public.sales_orders;
create trigger sales_orders_updated_at
  before update on public.sales_orders
  for each row
  execute function update_sales_orders_updated_at();

-- View com informações do revisor
create or replace view public.sales_orders_with_reviewer as
select 
  so.*,
  p.full_name as reviewer_name
from public.sales_orders so
left join public.profiles p on p.id = so.reviewed_by;

-- Enable RLS
alter table public.sales_orders enable row level security;

-- Drop existing policies
drop policy if exists "Sales orders viewable by company members" on public.sales_orders;
drop policy if exists "Sales orders insertable by company members" on public.sales_orders;
drop policy if exists "Sales orders updatable by company members" on public.sales_orders;
drop policy if exists "Sales orders deletable by company members" on public.sales_orders;

-- RLS Policies
create policy "Sales orders viewable by company members"
  on public.sales_orders for select
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Sales orders insertable by company members"
  on public.sales_orders for insert
  with check (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Sales orders updatable by company members"
  on public.sales_orders for update
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Sales orders deletable by company members"
  on public.sales_orders for delete
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );
