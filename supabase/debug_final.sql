-- 1. Check if the company exists
SELECT * FROM public.company_info;

-- 2. Check the profile of the Super Admin (evanildobarros@gmail.com)
-- Replace the ID below with the one from your screenshot if needed, but I'll try to find it via the profiles table if possible.
-- Since profiles is keyed by ID, I'll just list all profiles to be sure.
SELECT * FROM public.profiles;

-- 3. Check if the RLS policy exists
SELECT * FROM pg_policies WHERE tablename = 'company_info';
