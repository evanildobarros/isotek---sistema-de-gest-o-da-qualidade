-- 1. Add the column (safe if exists)
ALTER TABLE swot_analysis ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Reload cache
NOTIFY pgrst, 'reload config';

-- 3. Update Policy (Drop first to be safe)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON swot_analysis;

CREATE POLICY "Enable insert for authenticated users" ON swot_analysis
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
