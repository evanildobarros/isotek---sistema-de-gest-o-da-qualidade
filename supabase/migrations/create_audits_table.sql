-- Create audits table for ISO 9001:2015 - 9.2 Internal Audit Management
create table if not exists audits (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references company_info(id) on delete cascade not null,
  scope text not null, -- Escopo da auditoria (ex: "Vendas e Marketing", "Produção - Linha 1")
  type text not null, -- Tipo: 'Auditoria Interna', 'Auditoria de Processo', 'Auditoria Externa'
  auditor text not null, -- Nome do auditor responsável
  date date not null, -- Data planejada/realizada
  status text not null check (status in ('Agendada', 'Em Andamento', 'Concluída', 'Atrasada')),
  progress integer default 0 check (progress >= 0 and progress <= 100), -- Progresso em %
  notes text, -- Notas adicionais sobre a auditoria
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for better query performance
create index if not exists audits_company_id_idx on audits(company_id);
create index if not exists audits_status_idx on audits(status);
create index if not exists audits_date_idx on audits(date);

-- Enable Row Level Security
alter table audits enable row level security;

-- RLS Policies: Users can only access audits from their own company
create policy "Audits viewable by company members" on audits
  for select using (
    company_id in (
      select company_id from profiles where id = auth.uid()
    )
  );

create policy "Audits insertable by company members" on audits
  for insert with check (
    company_id in (
      select company_id from profiles where id = auth.uid()
    )
  );

create policy "Audits updatable by company members" on audits
  for update using (
    company_id in (
      select company_id from profiles where id = auth.uid()
    )
  );

create policy "Audits deletable by company members" on audits
  for delete using (
    company_id in (
      select company_id from profiles where id = auth.uid()
    )
  );

-- Create trigger to automatically update updated_at timestamp
create or replace function update_audits_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger audits_updated_at_trigger
  before update on audits
  for each row
  execute function update_audits_updated_at();
