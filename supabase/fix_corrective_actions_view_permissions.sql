-- Fix permissions for corrective_actions_with_details view
-- This ensures users can read from the view

-- Grant SELECT permission on the view to authenticated users
GRANT SELECT ON public.corrective_actions_with_details TO authenticated;

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
