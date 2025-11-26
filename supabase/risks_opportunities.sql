-- Create risks_opportunities table
CREATE TABLE IF NOT EXISTS risks_opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    company_id UUID REFERENCES company_info(id) ON DELETE CASCADE NOT NULL,
    swot_id UUID REFERENCES swot_analysis(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('risk', 'opportunity')),
    origin TEXT NOT NULL,
    description TEXT NOT NULL,
    probability INTEGER NOT NULL CHECK (probability >= 1 AND probability <= 5),
    impact INTEGER NOT NULL CHECK (impact >= 1 AND impact <= 5),
    action_plan TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived'))
);

-- Enable RLS
ALTER TABLE risks_opportunities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their company's risks" ON risks_opportunities
    FOR SELECT
    USING (
        company_id IN (
            SELECT id FROM company_info WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their company's risks" ON risks_opportunities
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT id FROM company_info WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their company's risks" ON risks_opportunities
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

CREATE POLICY "Users can delete their company's risks" ON risks_opportunities
    FOR DELETE
    USING (
        company_id IN (
            SELECT id FROM company_info WHERE owner_id = auth.uid()
        )
    );
