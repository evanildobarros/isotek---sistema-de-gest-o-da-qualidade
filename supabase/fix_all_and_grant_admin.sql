-- ========================================
-- MASTER FIX SCRIPT: RLS Recursion & Super Admin
-- ========================================
-- Execute this entire script in the Supabase SQL Editor to fix all issues.

-- 1. Create Safe Helper Functions (Bypass RLS)
-- These functions prevent the "infinite recursion" error
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Fix RLS Policies
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop potentially problematic policies
DROP POLICY IF EXISTS "Profiles visible only to same company members" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create the SAFE read policy
CREATE POLICY "Profiles visible only to same company members"
ON public.profiles
FOR SELECT
USING (
    -- Super Admins can see ALL profiles (using safe function)
    public.is_super_admin() = true
    OR
    -- Regular users can only see profiles from their own company (using safe function)
    company_id = public.get_user_company_id()
);

-- Ensure other policies exist
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (id = auth.uid());


-- 3. Grant Super Admin Privileges
-- Force update the specific user
UPDATE public.profiles
SET is_super_admin = true,
    role = 'admin'
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'evanildobarros@gmail.com'
);

-- 4. Verification Output
SELECT 
    u.email, 
    p.is_super_admin, 
    p.role, 
    CASE WHEN public.is_super_admin() THEN 'Function Works' ELSE 'Function Failed (or not logged in)' END as test_function
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'evanildobarros@gmail.com';
