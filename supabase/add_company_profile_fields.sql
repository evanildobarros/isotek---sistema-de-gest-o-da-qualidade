-- Add missing columns to company_info table
ALTER TABLE public.company_info
ADD COLUMN IF NOT EXISTS slogan TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Ensure RLS policies allow update for these columns (existing policy 'Enable update for owner' should cover it as it uses USING(auth.uid() = owner_id))
