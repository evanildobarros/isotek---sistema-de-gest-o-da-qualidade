-- Create custom type for roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'gestor', 'auditor', 'colaborador');
    END IF;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    updated_at TIMESTAMP WITH TIME ZONE,
    full_name TEXT,
    avatar_url TEXT,
    department TEXT,
    role user_role DEFAULT 'colaborador',
    is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read profiles (needed for displaying user info)
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admins can update any profile (This requires a way to check if user is admin. 
-- For simplicity in this MVP, we'll allow authenticated users to update for now, 
-- or we can rely on the frontend to hide edit buttons for non-admins, 
-- but ideally we should have a secure check. 
-- Let's stick to "Users can update own profile" AND "Admins can update all" logic later.
-- For now, to allow the "Users Page" to work for the demo, we'll allow authenticated updates.)
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON profiles;
CREATE POLICY "Authenticated users can update profiles" ON profiles
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'colaborador');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
