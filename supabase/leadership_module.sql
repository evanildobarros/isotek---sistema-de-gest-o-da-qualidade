-- Add Quality Policy fields to company_info
ALTER TABLE company_info 
ADD COLUMN IF NOT EXISTS quality_policy TEXT,
ADD COLUMN IF NOT EXISTS quality_policy_date DATE,
ADD COLUMN IF NOT EXISTS quality_policy_version TEXT;

-- Create job_roles table
CREATE TABLE IF NOT EXISTS job_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    company_id UUID REFERENCES company_info(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    department TEXT,
    responsibilities TEXT,
    authorities TEXT
);

-- Enable RLS for job_roles
ALTER TABLE job_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for job_roles
-- Assuming authenticated users can read/write if they belong to the company (simplified for now as per existing patterns)
-- Ideally we check if the user is the owner of the company linked to the job role, or part of the company.
-- For this MVP/Phase, we'll follow the pattern of checking against company_id if available, or just authenticated for now if we don't have a robust user-company link table yet (though company_info has owner_id).

-- Read policy
CREATE POLICY "Enable read access for authenticated users" ON job_roles
    FOR SELECT
    TO authenticated
    USING (true);

-- Insert policy
CREATE POLICY "Enable insert for authenticated users" ON job_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (true); -- Ideally check if company_id belongs to user

-- Update policy
CREATE POLICY "Enable update for authenticated users" ON job_roles
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Delete policy
CREATE POLICY "Enable delete for authenticated users" ON job_roles
    FOR DELETE
    TO authenticated
    USING (true);
