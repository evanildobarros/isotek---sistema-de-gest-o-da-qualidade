-- Fix missing columns in corrective_actions table
-- This script adds columns that might be missing if the initial creation was incomplete

-- Drop the view first to avoid dependency errors when dropping/renaming columns
DROP VIEW IF EXISTS public.corrective_actions_with_details;

DO $$
BEGIN
    -- Case 1: Both columns exist. Migrate data and drop 'issue'.
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'corrective_actions' AND column_name = 'issue') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'corrective_actions' AND column_name = 'description') THEN
        
        -- Migrate data
        UPDATE public.corrective_actions SET description = issue WHERE description IS NULL;
        
        -- Drop legacy column
        ALTER TABLE public.corrective_actions DROP COLUMN issue;
        
    -- Case 2: Only 'issue' exists. Rename it.
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'corrective_actions' AND column_name = 'issue') THEN
        ALTER TABLE public.corrective_actions RENAME COLUMN issue TO description;
        
    -- Case 3: 'description' missing (and no 'issue'). Add it.
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'corrective_actions' AND column_name = 'description') THEN
        ALTER TABLE public.corrective_actions ADD COLUMN description text;
    END IF;

    -- Add other potentially missing columns just in case
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'corrective_actions' AND column_name = 'root_cause') THEN
        ALTER TABLE public.corrective_actions ADD COLUMN root_cause text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'corrective_actions' AND column_name = 'immediate_action') THEN
        ALTER TABLE public.corrective_actions ADD COLUMN immediate_action text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'corrective_actions' AND column_name = 'effectiveness_verified') THEN
        ALTER TABLE public.corrective_actions ADD COLUMN effectiveness_verified boolean;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'corrective_actions' AND column_name = 'effectiveness_notes') THEN
        ALTER TABLE public.corrective_actions ADD COLUMN effectiveness_notes text;
    END IF;

    -- Ensure code and origin exist too
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'corrective_actions' AND column_name = 'code') THEN
        ALTER TABLE public.corrective_actions ADD COLUMN code text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'corrective_actions' AND column_name = 'origin') THEN
        ALTER TABLE public.corrective_actions ADD COLUMN origin text;
    END IF;

END $$;

-- Re-run the view creation to ensure it picks up the new columns
create or replace view public.corrective_actions_with_details as
select 
  ca.*,
  p.full_name as responsible_name,
  (
    select json_agg(
      json_build_object(
        'id', t.id,
        'description', t.description,
        'responsible_id', t.responsible_id,
        'responsible_name', tp.full_name,
        'due_date', t.due_date,
        'completed', t.completed,
        'completed_at', t.completed_at
      ) order by t.due_date
    )
    from public.corrective_action_tasks t
    left join public.profiles tp on tp.id = t.responsible_id
    where t.corrective_action_id = ca.id
  ) as tasks
from public.corrective_actions ca
left join public.profiles p on p.id = ca.responsible_id;

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
