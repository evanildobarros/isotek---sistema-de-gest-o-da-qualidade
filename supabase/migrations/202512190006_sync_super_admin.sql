-- =============================================================================
-- MIGRAÇÃO: Sincronizar Super Admin (ID Explícito)
-- Data: 2025-12-19
-- =============================================================================

UPDATE public.profiles
SET 
  is_super_admin = true,
  role = 'admin',
  full_name = 'EVANILDO DE JESUS CAMPOS BARROS'
WHERE id = '4731f4ec-6460-4a46-b8ad-19fc721ce1b7';
