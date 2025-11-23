-- Create company_info table
CREATE TABLE IF NOT EXISTS company_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read (for now, or restrict to authenticated)
CREATE POLICY "Enable read access for authenticated users" ON company_info
    FOR SELECT
    TO authenticated
    USING (true);

-- Authenticated users can insert
CREATE POLICY "Enable insert for authenticated users" ON company_info
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);

-- Owner can update
CREATE POLICY "Enable update for owner" ON company_info
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);
