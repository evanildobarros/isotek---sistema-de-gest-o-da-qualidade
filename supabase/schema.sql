-- Create the swot_analysis table if it doesn't exist
CREATE TABLE IF NOT EXISTS swot_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    description TEXT NOT NULL,
    impact TEXT NOT NULL CHECK (impact IN ('alto', 'medio', 'baixo')),
    type TEXT NOT NULL CHECK (type IN ('forca', 'fraqueza', 'oportunidade', 'ameaca')),
    is_active BOOLEAN DEFAULT true
);

-- Add user_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'swot_analysis' AND column_name = 'user_id') THEN
        ALTER TABLE swot_analysis ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE swot_analysis ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON swot_analysis;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON swot_analysis;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON swot_analysis;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON swot_analysis;

-- Create policies

-- Policy for reading items (allow authenticated users to read all items)
CREATE POLICY "Enable read access for authenticated users" ON swot_analysis
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy for inserting items (only authenticated users, and must match their uid)
CREATE POLICY "Enable insert for authenticated users" ON swot_analysis
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy for updating items (only owner)
CREATE POLICY "Enable update for users based on user_id" ON swot_analysis
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy for deleting items (only owner)
CREATE POLICY "Enable delete for users based on user_id" ON swot_analysis
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
