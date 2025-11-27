-- Tabela de Saídas Não Conformes (Non-Conformity Products)
-- ISO 9001:2015 - 8.7 Controle de Saídas Não Conformes

create table if not exists public.non_conformities_products (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.company_info(id) on delete cascade not null,
  description text not null,
  date_occurred date not null,
  origin text not null check (origin in ('Produção', 'Fornecedor', 'Cliente/Reclamação')),
  severity text not null check (severity in ('Baixa', 'Média', 'Crítica')),
  status text default 'open' check (status in ('open', 'analyzing', 'resolved')),
  disposition text check (disposition in ('Retrabalho', 'Refugo', 'Concessão/Aceite', 'Devolução')),
  quantity_affected integer,
  photo_url text, -- URL da foto de evidência
  responsible_id uuid references public.profiles(id),
  disposition_justification text,
  authorized_by text, -- Nome de quem autorizou a disposição
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Comentários para documentação
comment on table public.non_conformities_products is 'Registros de produtos/serviços não conformes (ISO 9001:2015 - 8.7)';
comment on column public.non_conformities_products.status is 'open=Identificada, analyzing=Em Análise, resolved=Tratada';
comment on column public.non_conformities_products.disposition is 'Ação tomada: Retrabalho, Refugo, Concessão/Aceite, Devolução';

-- Índices para otimizar consultas
create index if not exists idx_non_conformities_company_id on public.non_conformities_products(company_id);
create index if not exists idx_non_conformities_status on public.non_conformities_products(status);
create index if not exists idx_non_conformities_severity on public.non_conformities_products(severity);
create index if not exists idx_non_conformities_date on public.non_conformities_products(date_occurred);

-- Trigger para atualizar updated_at
create or replace function update_non_conformities_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists non_conformities_updated_at on public.non_conformities_products;
create trigger non_conformities_updated_at
  before update on public.non_conformities_products
  for each row
  execute function update_non_conformities_updated_at();

-- View com informações do responsável
create or replace view public.non_conformities_with_responsible as
select 
  nc.*,
  p.full_name as responsible_name
from public.non_conformities_products nc
left join public.profiles p on p.id = nc.responsible_id;

-- Enable RLS
alter table public.non_conformities_products enable row level security;

-- Drop existing policies
drop policy if exists "Non-conformities viewable by company members" on public.non_conformities_products;
drop policy if exists "Non-conformities insertable by company members" on public.non_conformities_products;
drop policy if exists "Non-conformities updatable by company members" on public.non_conformities_products;
drop policy if exists "Non-conformities deletable by company members" on public.non_conformities_products;

-- RLS Policies
create policy "Non-conformities viewable by company members"
  on public.non_conformities_products for select
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Non-conformities insertable by company members"
  on public.non_conformities_products for insert
  with check (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Non-conformities updatable by company members"
  on public.non_conformities_products for update
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Non-conformities deletable by company members"
  on public.non_conformities_products for delete
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

-- Instruções para criar o bucket de fotos
-- Execute no Supabase Dashboard → Storage → Create Bucket:
-- Nome: nc_photos
-- Public: true
--
-- Depois, configure as políticas RLS no bucket via SQL:
/*
drop policy if exists "NC photos readable by authenticated users" on storage.objects;
create policy "NC photos readable by authenticated users"
  on storage.objects for select
  using (bucket_id = 'nc_photos' and auth.role() = 'authenticated');

drop policy if exists "NC photos uploadable by company members" on storage.objects;
create policy "NC photos uploadable by company members"
  on storage.objects for insert
  with check (
    bucket_id = 'nc_photos' 
    and auth.role() = 'authenticated'
  );

drop policy if exists "NC photos deletable by company members" on storage.objects;
create policy "NC photos deletable by company members"
  on storage.objects for delete
  using (
    bucket_id = 'nc_photos' 
    and auth.role() = 'authenticated'
  );
*/
