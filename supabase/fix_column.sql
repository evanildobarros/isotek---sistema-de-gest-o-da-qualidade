-- Force add the user_id column
ALTER TABLE swot_analysis ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Reload the schema cache to ensure PostgREST picks up the change
NOTIFY pgrst, 'reload config';

-- Re-apply policies just in case
ALTER TABLE swot_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON swot_analysis;
CREATE POLICY "Enable insert for authenticated users" ON swot_analysis
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
