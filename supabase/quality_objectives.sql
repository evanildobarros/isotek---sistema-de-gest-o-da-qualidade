-- Create quality_objectives table
CREATE TABLE IF NOT EXISTS quality_objectives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    company_id UUID REFERENCES company_info(id) ON DELETE CASCADE NOT NULL,
    process_id UUID REFERENCES processes(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    deadline DATE NOT NULL,
    metric_name TEXT NOT NULL,
    target_value NUMERIC NOT NULL,
    current_value NUMERIC DEFAULT 0,
    action_plan TEXT
);

-- Enable RLS
ALTER TABLE quality_objectives ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their company's objectives" ON quality_objectives
    FOR SELECT
    USING (
        company_id IN (
            SELECT id FROM company_info WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their company's objectives" ON quality_objectives
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT id FROM company_info WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their company's objectives" ON quality_objectives
    FOR UPDATE
    USING (
        company_id IN (
            SELECT id FROM company_info WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        company_id IN (
            SELECT id FROM company_info WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their company's objectives" ON quality_objectives
    FOR DELETE
    USING (
        company_id IN (
            SELECT id FROM company_info WHERE owner_id = auth.uid()
        )
    );
