-- Fix Orphan Companies (Missing Owner)
-- This script links any company without an owner to the Super Admin (Evanildo)
-- ID: 4731f4ec-6460-4a46-b8ad-19fc721ce1b7

UPDATE public.company_info
SET owner_id = '4731f4ec-6460-4a46-b8ad-19fc721ce1b7'
WHERE owner_id IS NULL;

-- Also ensure the profile exists and is linked
UPDATE public.profiles
SET company_id = (SELECT id FROM public.company_info WHERE owner_id = '4731f4ec-6460-4a46-b8ad-19fc721ce1b7' LIMIT 1),
    is_super_admin = true,
    role = 'admin'
WHERE id = '4731f4ec-6460-4a46-b8ad-19fc721ce1b7';
