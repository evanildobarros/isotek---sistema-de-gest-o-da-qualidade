-- Add missing 'notes' column to audits table
-- This fixes the PGRST204 error: "Could not find the 'notes' column"

-- Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'audits' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE audits ADD COLUMN notes text;
        RAISE NOTICE 'Column "notes" added successfully';
    ELSE
        RAISE NOTICE 'Column "notes" already exists';
    END IF;
END $$;
