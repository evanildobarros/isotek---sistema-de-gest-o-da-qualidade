-- Adicionar campos de integração de pagamento na empresa
alter table company_info 
add column if not exists stripe_customer_id text,
add column if not exists stripe_subscription_id text,
add column if not exists payment_method_brand text, -- ex: 'visa', 'mastercard'
add column if not exists payment_method_last4 text; -- ex: '4242'

-- Tabela de Faturas (Histórico)
create table if not exists invoices (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references company_info(id) not null,
  stripe_invoice_id text,
  amount numeric(10,2) not null,
  status text check (status in ('paid', 'open', 'void', 'uncollectible')),
  invoice_pdf_url text, -- Link para baixar o PDF
  created_at timestamp with time zone default now()
);

-- RLS
alter table invoices enable row level security;

-- Política para permitir que usuários vejam faturas da sua própria empresa
create policy "Invoices viewable by company" on invoices
  for select using (company_id in (select company_id from profiles where id = auth.uid()));
