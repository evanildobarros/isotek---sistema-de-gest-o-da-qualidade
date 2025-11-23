-- Corrective Actions Module - Database Schema
-- ISO 9001:10.2 Corrective Actions Management

-- ============================================================================
-- TABLE: corrective_actions
-- Main table for corrective actions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.corrective_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE, -- e.g., "AC-2024-001"
    origin TEXT NOT NULL, -- e.g., "Auditoria Interna", "NC-015"
    issue TEXT NOT NULL, -- Description of the problem
    root_cause TEXT, -- 5 Whys / Ishikawa analysis
    responsible_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deadline DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Planejamento',
    
    -- Effectiveness verification
    effectiveness_verified BOOLEAN DEFAULT FALSE,
    problem_recurred BOOLEAN, -- NULL = not verified yet, TRUE = ineffective, FALSE = effective
    audit_notes TEXT,
    
    -- Metadata
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    
    CONSTRAINT valid_status CHECK (status IN ('Planejamento', 'Em Andamento', 'Verificar Eficácia', 'Concluída'))
);

-- ============================================================================
-- TABLE: action_tasks
-- Checklist items for each corrective action
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.action_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action_id UUID NOT NULL REFERENCES public.corrective_actions(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_index INTEGER DEFAULT 0, -- For sorting tasks
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: action_evidence
-- Uploaded files/photos as evidence
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.action_evidence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action_id UUID NOT NULL REFERENCES public.corrective_actions(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL, -- e.g., "image/jpeg", "application/pdf"
    file_size BIGINT NOT NULL,
    description TEXT,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: action_timeline
-- History/audit trail of all actions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.action_timeline (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action_id UUID NOT NULL REFERENCES public.corrective_actions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- e.g., "created", "status_changed", "task_completed", "evidence_uploaded"
    description TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB, -- Additional data (e.g., old_status, new_status)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_corrective_actions_owner ON public.corrective_actions(owner_id);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_responsible ON public.corrective_actions(responsible_id);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_status ON public.corrective_actions(status);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_deadline ON public.corrective_actions(deadline);

CREATE INDEX IF NOT EXISTS idx_action_tasks_action ON public.action_tasks(action_id);
CREATE INDEX IF NOT EXISTS idx_action_evidence_action ON public.action_evidence(action_id);
CREATE INDEX IF NOT EXISTS idx_action_timeline_action ON public.action_timeline(action_id);
CREATE INDEX IF NOT EXISTS idx_action_timeline_created ON public.action_timeline(created_at DESC);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================
ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_timeline ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: corrective_actions
-- ============================================================================

-- All authenticated users can view all actions (company-wide visibility)
CREATE POLICY "Actions are viewable by authenticated users" 
    ON public.corrective_actions 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Users can create actions
CREATE POLICY "Users can create actions" 
    ON public.corrective_actions 
    FOR INSERT 
    WITH CHECK (auth.uid() = owner_id);

-- Users can update their own actions OR actions they're responsible for
CREATE POLICY "Users can update their own or assigned actions" 
    ON public.corrective_actions 
    FOR UPDATE 
    USING (auth.uid() = owner_id OR auth.uid() = responsible_id);

-- Users can delete their own actions
CREATE POLICY "Users can delete their own actions" 
    ON public.corrective_actions 
    FOR DELETE 
    USING (auth.uid() = owner_id);

-- ============================================================================
-- RLS POLICIES: action_tasks
-- ============================================================================

CREATE POLICY "Tasks are viewable by authenticated users" 
    ON public.action_tasks 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert tasks for actions they own/manage" 
    ON public.action_tasks 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.corrective_actions 
            WHERE id = action_id 
            AND (owner_id = auth.uid() OR responsible_id = auth.uid())
        )
    );

CREATE POLICY "Users can update tasks for actions they own/manage" 
    ON public.action_tasks 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.corrective_actions 
            WHERE id = action_id 
            AND (owner_id = auth.uid() OR responsible_id = auth.uid())
        )
    );

CREATE POLICY "Users can delete tasks for actions they own/manage" 
    ON public.action_tasks 
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.corrective_actions 
            WHERE id = action_id 
            AND (owner_id = auth.uid() OR responsible_id = auth.uid())
        )
    );

-- ============================================================================
-- RLS POLICIES: action_evidence
-- ============================================================================

CREATE POLICY "Evidence is viewable by authenticated users" 
    ON public.action_evidence 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can upload evidence for actions they own/manage" 
    ON public.action_evidence 
    FOR INSERT 
    WITH CHECK (
        auth.uid() = uploaded_by
        AND EXISTS (
            SELECT 1 FROM public.corrective_actions 
            WHERE id = action_id 
            AND (owner_id = auth.uid() OR responsible_id = auth.uid())
        )
    );

CREATE POLICY "Users can delete their own evidence" 
    ON public.action_evidence 
    FOR DELETE 
    USING (auth.uid() = uploaded_by);

-- ============================================================================
-- RLS POLICIES: action_timeline
-- ============================================================================

CREATE POLICY "Timeline is viewable by authenticated users" 
    ON public.action_timeline 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert timeline events" 
    ON public.action_timeline 
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- STORAGE BUCKET for evidence files
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('action-evidence', 'action-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_corrective_actions_updated_at 
    BEFORE UPDATE ON public.corrective_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGER: Auto-create timeline entry on action creation
-- ============================================================================
CREATE OR REPLACE FUNCTION create_action_timeline_on_create()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.action_timeline (action_id, event_type, description, changed_by)
    VALUES (
        NEW.id,
        'created',
        'Ação corretiva criada: ' || NEW.issue,
        NEW.owner_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER action_created_timeline 
    AFTER INSERT ON public.corrective_actions
    FOR EACH ROW
    EXECUTE FUNCTION create_action_timeline_on_create();

-- ============================================================================
-- TRIGGER: Auto-create timeline entry on status change
-- ============================================================================
CREATE OR REPLACE FUNCTION create_timeline_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO public.action_timeline (action_id, event_type, description, changed_by, metadata)
        VALUES (
            NEW.id,
            'status_changed',
            'Status alterado de "' || OLD.status || '" para "' || NEW.status || '"',
            auth.uid(),
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER action_status_changed_timeline 
    AFTER UPDATE ON public.corrective_actions
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION create_timeline_on_status_change();
