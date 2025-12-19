-- =============================================================================
-- MIGRAÇÃO: Promover Usuário a Super Admin
-- Data: 2025-12-19
-- =============================================================================

UPDATE public.profiles
SET 
  is_super_admin = true,
  role = 'admin'
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'evanildobarros@gmail.com'
);
