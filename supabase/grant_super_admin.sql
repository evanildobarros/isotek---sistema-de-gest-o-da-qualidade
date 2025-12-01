-- ========================================
-- GRANT SUPER ADMIN PRIVILEGES
-- ========================================

-- 1. Update the profile for the specific user
-- We use a subquery to find the ID from auth.users because profiles table doesn't have email column
UPDATE public.profiles
SET is_super_admin = true,
    role = 'admin' -- Also set standard role to admin just in case
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'evanildobarros@gmail.com'
);

-- 2. Verify the update
SELECT p.id, u.email, p.is_super_admin, p.role
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'evanildobarros@gmail.com';
