-- Permitir que Super Admins vejam TODOS os perfis (necessário para ver nome/email do dono da empresa)
-- Primeiro removemos a política se ela já existir para evitar erro
drop policy if exists "Super Admins can view all profiles" on profiles;

create policy "Super Admins can view all profiles"
on profiles
for select
using (
  -- Verifica se o usuário atual é super admin
  (select is_super_admin from profiles where id = auth.uid()) = true
);
