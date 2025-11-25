-- Check schema and policies for swot_analysis
SELECT 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'swot_analysis';

SELECT * FROM pg_policies WHERE tablename = 'swot_analysis';

-- Check the data itself to see if it has company_id
SELECT * FROM public.swot_analysis;
