-- Tabela de Ordens de Produção/Serviço (Production Orders)
-- ISO 9001:2015 - 8.5 Produção e Provisão de Serviço

create table if not exists public.production_orders (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.company_info(id) on delete cascade not null,
  code text not null, -- Número da OP/OS
  sales_order_id uuid references public.sales_orders(id) on delete set null, -- Link opcional com pedido
  product_service text not null, -- O que está sendo produzido/executado
  status text default 'scheduled' check (status in ('scheduled', 'in_progress', 'quality_check', 'completed')),
  start_date date,
  end_date date,
  batch_number text, -- Rastreabilidade (Lote/Série/Versão) - ISO 8.5.2
  work_instructions text, -- Instruções documentadas - ISO 8.5.1(e)
  notes text, -- Registros de execução
  current_stage text, -- Etapa atual do trabalho
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Comentários para documentação
comment on table public.production_orders is 'Ordens de Produção/Serviço com execução controlada (ISO 9001:2015 - 8.5)';
comment on column public.production_orders.status is 'scheduled=Agendado, in_progress=Em Andamento, quality_check=Verificação, completed=Concluído';
comment on column public.production_orders.batch_number is 'Número de rastreabilidade (Lote/Série) - Obrigatório para conclusão (ISO 8.5.2)';

-- Índices para otimizar consultas
create index if not exists idx_production_orders_company_id on public.production_orders(company_id);
create index if not exists idx_production_orders_status on public.production_orders(status);
create index if not exists idx_production_orders_sales_order on public.production_orders(sales_order_id);
create index if not exists idx_production_orders_code on public.production_orders(code);

-- Trigger para atualizar updated_at
create or replace function update_production_orders_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists production_orders_updated_at on public.production_orders;
create trigger production_orders_updated_at
  before update on public.production_orders
  for each row
  execute function update_production_orders_updated_at();

-- View com informações do pedido de venda (cliente)
create or replace view public.production_orders_with_details as
select 
  po.*,
  so.code as sales_order_code,
  so.client_name
from public.production_orders po
left join public.sales_orders so on so.id = po.sales_order_id;

-- Enable RLS
alter table public.production_orders enable row level security;

-- Drop existing policies
drop policy if exists "Production orders viewable by company members" on public.production_orders;
drop policy if exists "Production orders insertable by company members" on public.production_orders;
drop policy if exists "Production orders updatable by company members" on public.production_orders;
drop policy if exists "Production orders deletable by company members" on public.production_orders;

-- RLS Policies
create policy "Production orders viewable by company members"
  on public.production_orders for select
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Production orders insertable by company members"
  on public.production_orders for insert
  with check (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Production orders updatable by company members"
  on public.production_orders for update
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Production orders deletable by company members"
  on public.production_orders for delete
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );
