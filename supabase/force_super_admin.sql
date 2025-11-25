-- Force Super Admin flag for the user
UPDATE public.profiles
SET is_super_admin = true
WHERE id IN (SELECT id FROM auth.users WHERE email = 'evanildobarros@gmail.com');

-- Verify the update
SELECT * FROM public.profiles WHERE is_super_admin = true;

-- Verify companies again
SELECT * FROM public.company_info;
