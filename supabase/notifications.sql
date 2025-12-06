-- =====================================================
-- CENTRO DE NOTIFICAÇÕES - Tabela e Políticas RLS
-- Execute este arquivo no Supabase SQL Editor
-- =====================================================

-- Tabela de Notificações
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references company_info(id) not null,
  recipient_id uuid references profiles(id), -- Opcional: Se null, é para todos da empresa
  title text not null,
  message text,
  type text default 'info', -- info, warning, success, error
  link text, -- Para onde vai ao clicar (ex: /app/nao-conformidades)
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- Índices para performance
create index if not exists idx_notifications_company on notifications(company_id);
create index if not exists idx_notifications_recipient on notifications(recipient_id);
create index if not exists idx_notifications_read on notifications(read);
create index if not exists idx_notifications_created on notifications(created_at desc);

-- RLS (Row Level Security)
alter table notifications enable row level security;

-- Política SELECT: Usuário vê notificações da sua empresa (gerais ou específicas para ele)
create policy "Notifications viewable by recipient or company" on notifications
  for select using (
    company_id = (select company_id from profiles where id = auth.uid())
    and (recipient_id is null or recipient_id = auth.uid())
  );

-- Política UPDATE: Usuário pode marcar como lida suas notificações
create policy "Notifications updatable by recipient" on notifications
  for update using (
    company_id = (select company_id from profiles where id = auth.uid())
    and (recipient_id is null or recipient_id = auth.uid())
  );

-- Política INSERT: Usuários autenticados podem criar notificações
create policy "Authenticated users can insert notifications" on notifications
  for insert with check (auth.uid() is not null);

-- Política DELETE: Usuários podem deletar suas próprias notificações
create policy "Users can delete own notifications" on notifications
  for delete using (
    company_id = (select company_id from profiles where id = auth.uid())
    and (recipient_id is null or recipient_id = auth.uid())
  );
