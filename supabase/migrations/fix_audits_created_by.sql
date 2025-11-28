-- Fix: Remove NOT NULL constraint from created_by OR make it nullable
-- The table has a created_by column that we're not populating

-- Option 1: Make created_by nullable (RECOMMENDED)
ALTER TABLE audits ALTER COLUMN created_by DROP NOT NULL;

-- Option 2: Drop the column entirely (if you don't need it)
-- ALTER TABLE audits DROP COLUMN IF EXISTS created_by;
