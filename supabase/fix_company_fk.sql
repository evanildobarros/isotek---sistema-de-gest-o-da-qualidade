-- Fix Foreign Key on company_info
DO $$
BEGIN
    -- 1. Drop the existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'company_info_owner_id_fkey') THEN
        ALTER TABLE public.company_info DROP CONSTRAINT company_info_owner_id_fkey;
    END IF;

    -- 2. Add the correct constraint referencing auth.users
    -- We use ON DELETE SET NULL or CASCADE depending on preference. Let's use SET NULL to keep company info if user is deleted.
    ALTER TABLE public.company_info
    ADD CONSTRAINT company_info_owner_id_fkey
    FOREIGN KEY (owner_id)
    REFERENCES auth.users(id)
    ON DELETE SET NULL;

END $$;
