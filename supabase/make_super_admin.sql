-- Atualizar o perfil do usuário para Super Admin
update profiles
set 
  is_super_admin = true,
  role = 'admin' -- Enum user_role aceita 'admin' ou 'user' (owner é apenas visual no frontend)
where id = (
  select id 
  from auth.users 
  where email = 'evanildobarros@gmail.com'
);

-- Verificação (opcional, retorna o usuário atualizado)
select * from profiles 
where id = (select id from auth.users where email = 'evanildobarros@gmail.com');
