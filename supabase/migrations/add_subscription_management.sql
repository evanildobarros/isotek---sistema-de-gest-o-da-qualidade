-- ================================================
-- ISOTEK - Sistema de Gestão de Assinaturas
-- ================================================
-- Este script adiciona suporte para planos e assinaturas
-- Execute no SQL Editor do Supabase Dashboard

-- 1. Adicionar colunas de assinatura na tabela company_info
alter table company_info 
add column if not exists subscription_status text default 'active',
add column if not exists plan_id text default 'start',
add column if not exists current_period_end timestamp with time zone,
add column if not exists max_users integer default 5,
add column if not exists max_storage_gb integer default 5;

-- 2. Atualizar empresas existentes para o plano START
update company_info 
set 
  plan_id = coalesce(plan_id, 'start'),
  subscription_status = coalesce(subscription_status, 'active'),
  max_users = coalesce(max_users, 5),
  max_storage_gb = coalesce(max_storage_gb, 5)
where plan_id is null or subscription_status is null;

-- 3. Adicionar comentários para documentação
comment on column company_info.subscription_status is 'Status da assinatura: active, past_due, canceled, trialing';
comment on column company_info.plan_id is 'ID do plano contratado: start, pro, enterprise';
comment on column company_info.current_period_end is 'Data de término do período atual de cobrança';
comment on column company_info.max_users is 'Número máximo de usuários permitidos no plano';
comment on column company_info.max_storage_gb is 'Limite de armazenamento em GB';

-- 4. Verificar resultado
select 
  id, 
  name, 
  plan_id, 
  subscription_status, 
  max_users, 
  max_storage_gb,
  current_period_end
from company_info
limit 10;
