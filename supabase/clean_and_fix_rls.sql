-- ========================================
-- AGGRESSIVE FIX: Clean Slate RLS & Permissions
-- ========================================

-- 1. Clean up ALL existing policies on profiles table
-- We use a DO block to dynamically drop any policy that exists, ensuring a clean slate.
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- 2. Create/Refresh Safe Helper Functions (SECURITY DEFINER)
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

-- 3. Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create the ROBUST Read Policy
-- This policy explicitly allows reading your own profile first, which fixes the "Colaborador" fallback issue.
CREATE POLICY "Profiles visible only to same company members"
ON public.profiles
FOR SELECT
USING (
    id = auth.uid() -- ALWAYS allow user to see their own profile (Critical for app startup)
    OR
    public.is_super_admin() = true -- Allow Super Admin to see everyone
    OR
    company_id = public.get_user_company_id() -- Allow seeing company peers
);

-- 5. Create other standard policies
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (id = auth.uid());

-- 6. Force Grant Super Admin (Again, to be sure)
UPDATE public.profiles
SET is_super_admin = true,
    role = 'admin'
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'evanildobarros@gmail.com'
);

-- 7. Verification
SELECT u.email, p.is_super_admin, p.role FROM public.profiles p JOIN auth.users u ON p.id = u.id WHERE u.email = 'evanildobarros@gmail.com';
