-- Check if companies exist
SELECT * FROM public.company_info;

-- Check active policies on company_info
SELECT * FROM pg_policies WHERE tablename = 'company_info';
