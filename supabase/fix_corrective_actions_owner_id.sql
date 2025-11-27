-- Fix corrective_actions table to remove owner_id column and all its dependencies
-- This migration addresses the NOT NULL constraint error on owner_id

-- Step 1: Drop the view first
DROP VIEW IF EXISTS public.corrective_actions_with_details;

-- Step 2: Drop all policies that depend on owner_id in corrective_actions table
DROP POLICY IF EXISTS "Users can create actions" ON public.corrective_actions;
DROP POLICY IF EXISTS "Users can update their own or assigned actions" ON public.corrective_actions;
DROP POLICY IF EXISTS "Users can delete their own actions" ON public.corrective_actions;

-- Step 3: Drop policies on related tables that reference owner_id from corrective_actions
DROP POLICY IF EXISTS "Users can insert tasks for actions they own/manage" ON public.action_tasks;
DROP POLICY IF EXISTS "Users can update tasks for actions they own/manage" ON public.action_tasks;
DROP POLICY IF EXISTS "Users can delete tasks for actions they own/manage" ON public.action_tasks;

-- Also try the corrective_action_tasks table (in case it's named differently)
DROP POLICY IF EXISTS "Users can insert tasks for actions they own/manage" ON public.corrective_action_tasks;
DROP POLICY IF EXISTS "Users can update tasks for actions they own/manage" ON public.corrective_action_tasks;
DROP POLICY IF EXISTS "Users can delete tasks for actions they own/manage" ON public.corrective_action_tasks;

-- Step 4: Drop policies on action_evidence table if it exists
DROP POLICY IF EXISTS "Users can upload evidence for actions they own/manage" ON public.action_evidence;

-- Step 5: Now we can safely drop the owner_id column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'corrective_actions' 
        AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE public.corrective_actions DROP COLUMN owner_id;
    END IF;
END $$;

-- Step 6: Ensure responsible_id exists (it should already exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'corrective_actions' 
        AND column_name = 'responsible_id'
    ) THEN
        ALTER TABLE public.corrective_actions 
        ADD COLUMN responsible_id uuid 
        REFERENCES public.profiles(id) NOT NULL;
    END IF;
END $$;

-- Step 7: Recreate the view using the correct columns
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

-- Step 8: Recreate the RLS policies using company_id (which is the correct pattern)
-- First, drop the existing policies if they exist
DROP POLICY IF EXISTS "Corrective actions viewable by company members" ON public.corrective_actions;
DROP POLICY IF EXISTS "Corrective actions insertable by company members" ON public.corrective_actions;
DROP POLICY IF EXISTS "Corrective actions updatable by company members" ON public.corrective_actions;
DROP POLICY IF EXISTS "Corrective actions deletable by company members" ON public.corrective_actions;

DROP POLICY IF EXISTS "Corrective action tasks viewable by company members" ON public.corrective_action_tasks;
DROP POLICY IF EXISTS "Corrective action tasks insertable by company members" ON public.corrective_action_tasks;
DROP POLICY IF EXISTS "Corrective action tasks updatable by company members" ON public.corrective_action_tasks;
DROP POLICY IF EXISTS "Corrective action tasks deletable by company members" ON public.corrective_action_tasks;

-- Now recreate them
create policy "Corrective actions viewable by company members"
  on public.corrective_actions for select
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Corrective actions insertable by company members"
  on public.corrective_actions for insert
  with check (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Corrective actions updatable by company members"
  on public.corrective_actions for update
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

create policy "Corrective actions deletable by company members"
  on public.corrective_actions for delete
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

-- Step 9: Recreate policies for corrective_action_tasks
create policy "Corrective action tasks viewable by company members"
  on public.corrective_action_tasks for select
  using (
    corrective_action_id in (
      select id from public.corrective_actions where company_id in (
        select company_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy "Corrective action tasks insertable by company members"
  on public.corrective_action_tasks for insert
  with check (
    corrective_action_id in (
      select id from public.corrective_actions where company_id in (
        select company_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy "Corrective action tasks updatable by company members"
  on public.corrective_action_tasks for update
  using (
    corrective_action_id in (
      select id from public.corrective_actions where company_id in (
        select company_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy "Corrective action tasks deletable by company members"
  on public.corrective_action_tasks for delete
  using (
    corrective_action_id in (
      select id from public.corrective_actions where company_id in (
        select company_id from public.profiles where id = auth.uid()
      )
    )
  );

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
