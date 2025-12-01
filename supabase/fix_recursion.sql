-- ========================================
-- FIX: Infinite Recursion in RLS Policies
-- ========================================

-- 1. Create helper function to check super admin status
-- SECURITY DEFINER allows this function to run with the privileges of the creator
-- bypassing RLS on the profiles table for this specific check
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

-- 2. Create helper function to get user's company_id
-- Also uses SECURITY DEFINER to safely fetch company_id without triggering recursion
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 3. Drop the problematic recursive policy
DROP POLICY IF EXISTS "Profiles visible only to same company members" ON public.profiles;

-- 4. Create the new optimized policy using the helper functions
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

-- 5. Verification
-- Run this to verify the functions exist
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('is_super_admin', 'get_user_company_id');
