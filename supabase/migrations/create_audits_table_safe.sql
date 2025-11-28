-- SAFE MIGRATION: Can be run multiple times without errors
-- This version drops existing policies before creating new ones

-- Create audits table (IF NOT EXISTS prevents error if table exists)
create table if not exists audits (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references company_info(id) on delete cascade not null,
  scope text not null,
  type text not null,
  auditor text not null,
  date date not null,
  status text not null check (status in ('Agendada', 'Em Andamento', 'Concluída', 'Atrasada')),
  progress integer default 0 check (progress >= 0 and progress <= 100),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes (IF NOT EXISTS prevents errors)
create index if not exists audits_company_id_idx on audits(company_id);
create index if not exists audits_status_idx on audits(status);
create index if not exists audits_date_idx on audits(date);

-- Enable RLS
alter table audits enable row level security;

-- Drop existing policies (IF EXISTS prevents errors if they don't exist)
drop policy if exists "Audits viewable by company members" on audits;
drop policy if exists "Audits insertable by company members" on audits;
drop policy if exists "Audits updatable by company members" on audits;
drop policy if exists "Audits deletable by company members" on audits;

-- Create policies (now safe because we dropped them first)
create policy "Audits viewable by company members" on audits
  for select using (
    company_id in (select company_id from profiles where id = auth.uid())
  );

create policy "Audits insertable by company members" on audits
  for insert with check (
    company_id in (select company_id from profiles where id = auth.uid())
  );

create policy "Audits updatable by company members" on audits
  for update using (
    company_id in (select company_id from profiles where id = auth.uid())
  );

create policy "Audits deletable by company members" on audits
  for delete using (
    company_id in (select company_id from profiles where id = auth.uid())
  );

-- Create or replace trigger function (OR REPLACE prevents errors)
create or replace function update_audits_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Drop existing trigger if exists, then create new one
drop trigger if exists audits_updated_at_trigger on audits;
create trigger audits_updated_at_trigger
  before update on audits
  for each row
  execute function update_audits_updated_at();
