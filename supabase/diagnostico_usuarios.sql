-- SCRIPT DE DIAGNÓSTICO - Execute para ver o que está acontecendo
-- Não modifica nada, apenas mostra informações

-- 1. Ver todos os perfis e seus company_ids
select 
  p.id,
  au.email,
  p.full_name,
  p.role,
  p.company_id,
  p.is_super_admin
from profiles p
join auth.users au on p.id = au.id
order by p.created_at desc;

-- 2. Ver todas as empresas
select id, name from company_info;

-- 3. Testar a função get_users_with_emails
select * from get_users_with_emails();
