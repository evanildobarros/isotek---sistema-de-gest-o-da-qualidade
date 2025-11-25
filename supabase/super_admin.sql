-- Add columns to company_info
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_info' AND column_name = 'status') THEN
        ALTER TABLE public.company_info ADD COLUMN status text DEFAULT 'active';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_info' AND column_name = 'plan') THEN
        ALTER TABLE public.company_info ADD COLUMN plan text DEFAULT 'start';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_info' AND column_name = 'cnpj') THEN
        ALTER TABLE public.company_info ADD COLUMN cnpj text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_info' AND column_name = 'monthly_revenue') THEN
        ALTER TABLE public.company_info ADD COLUMN monthly_revenue numeric DEFAULT 0;
    END IF;
END $$;

-- Add columns to profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_super_admin') THEN
        ALTER TABLE public.profiles ADD COLUMN is_super_admin boolean DEFAULT false;
    END IF;
END $$;

-- Policy to allow Super Admins to view all companies (optional, but good for security)
-- For now, we rely on client-side check + RLS could be expanded later.
-- Currently "Enable read access for authenticated users" is true, so it's fine.

-- FIX RLS FOR SUPER ADMIN ACTIONS

-- 1. Allow Super Admin to INSERT into company_info (for other users)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.company_info;

CREATE POLICY "Enable insert for authenticated users and Super Admins" ON public.company_info
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = owner_id
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true)
    OR
    auth.jwt() ->> 'email' = 'evanildobarros@gmail.com'
);

-- 2. Allow Super Admin to UPDATE profiles (to set role/company for new users)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile OR Super Admin can update all" ON public.profiles
FOR UPDATE
USING (
    auth.uid() = id
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true)
    OR
    auth.jwt() ->> 'email' = 'evanildobarros@gmail.com'
);

-- 3. Allow Super Admin to SELECT all profiles (to check is_super_admin flag safely)
-- The existing "Public profiles are viewable by everyone" covers this, but good to be sure.

