-- ============================================
-- MIGRAÇÃO: Lógica Financeira de Níveis
-- Isotek SGQ - Sistema de Gestão da Qualidade
-- ============================================

-- ============================================
-- 1. CRIAR TABELA AUDITOR_LEVELS (Referência)
-- Define regras de negócio por nível
-- ============================================

CREATE TABLE IF NOT EXISTS auditor_levels (
    level_id TEXT PRIMARY KEY,              -- 'bronze', 'silver', 'gold', 'diamond'
    name TEXT NOT NULL,                     -- Nome do nível
    min_xp INTEGER NOT NULL DEFAULT 0,      -- XP mínimo para atingir
    commission_rate NUMERIC(3,2) NOT NULL,  -- Taxa de comissão (0.70 = 70%)
    allowed_plans TEXT[] NOT NULL,          -- Planos que pode atender
    max_simultaneous_audits INTEGER DEFAULT 3, -- Limite de auditorias simultâneas
    priority_support BOOLEAN DEFAULT FALSE, -- Suporte prioritário
    badge_icon TEXT DEFAULT 'Award',        -- Ícone do badge
    badge_color TEXT DEFAULT 'text-amber-500', -- Cor do badge
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca rápida
CREATE INDEX IF NOT EXISTS idx_auditor_levels_min_xp ON auditor_levels(min_xp);

-- ============================================
-- 2. SEED DATA - Níveis Padrão
-- ============================================

INSERT INTO auditor_levels (level_id, name, min_xp, commission_rate, allowed_plans, max_simultaneous_audits, priority_support, badge_icon, badge_color)
VALUES 
    ('bronze', 'Bronze', 0, 0.70, ARRAY['start'], 2, FALSE, 'Medal', 'text-amber-600'),
    ('silver', 'Prata', 500, 0.75, ARRAY['start', 'pro'], 3, FALSE, 'Award', 'text-gray-500'),
    ('gold', 'Ouro', 1000, 0.80, ARRAY['start', 'pro', 'enterprise'], 5, TRUE, 'Trophy', 'text-yellow-500'),
    ('platinum', 'Platina', 2500, 0.85, ARRAY['start', 'pro', 'enterprise'], 7, TRUE, 'Crown', 'text-cyan-500'),
    ('diamond', 'Diamante', 5000, 0.90, ARRAY['start', 'pro', 'enterprise', 'custom'], 10, TRUE, 'Star', 'text-purple-500')
ON CONFLICT (level_id) DO UPDATE SET
    name = EXCLUDED.name,
    min_xp = EXCLUDED.min_xp,
    commission_rate = EXCLUDED.commission_rate,
    allowed_plans = EXCLUDED.allowed_plans,
    max_simultaneous_audits = EXCLUDED.max_simultaneous_audits,
    priority_support = EXCLUDED.priority_support,
    badge_icon = EXCLUDED.badge_icon,
    badge_color = EXCLUDED.badge_color,
    updated_at = NOW();

-- ============================================
-- 3. ATUALIZAR TABELA AUDIT_ASSIGNMENTS
-- Adicionar campos financeiros (snapshot)
-- ============================================

DO $$ 
BEGIN
    -- Valor total acordado da auditoria
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_assignments' AND column_name = 'agreed_amount'
    ) THEN
        ALTER TABLE audit_assignments ADD COLUMN agreed_amount NUMERIC(10,2) DEFAULT 0.00;
    END IF;

    -- Taxa de comissão do auditor no momento da contratação
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_assignments' AND column_name = 'auditor_commission_rate'
    ) THEN
        ALTER TABLE audit_assignments ADD COLUMN auditor_commission_rate NUMERIC(3,2) DEFAULT 0.70;
    END IF;

    -- Taxa da plataforma (quanto Isotek ganhou)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_assignments' AND column_name = 'platform_fee'
    ) THEN
        ALTER TABLE audit_assignments ADD COLUMN platform_fee NUMERIC(10,2) DEFAULT 0.00;
    END IF;

    -- Valor que o auditor recebe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_assignments' AND column_name = 'auditor_payout'
    ) THEN
        ALTER TABLE audit_assignments ADD COLUMN auditor_payout NUMERIC(10,2) DEFAULT 0.00;
    END IF;

    -- Status do pagamento
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_assignments' AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE audit_assignments ADD COLUMN payment_status TEXT DEFAULT 'pending';
    END IF;

    -- Data do pagamento
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_assignments' AND column_name = 'paid_at'
    ) THEN
        ALTER TABLE audit_assignments ADD COLUMN paid_at TIMESTAMPTZ;
    END IF;
END $$;

-- ============================================
-- 4. RLS PARA AUDITOR_LEVELS
-- ============================================

ALTER TABLE auditor_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos podem ver níveis" ON auditor_levels;
CREATE POLICY "Todos podem ver níveis" ON auditor_levels
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super Admin gerencia níveis" ON auditor_levels;
CREATE POLICY "Super Admin gerencia níveis" ON auditor_levels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_super_admin = true
        )
    );

-- ============================================
-- 5. FUNÇÃO: Obter nível do auditor pelo XP
-- ============================================

CREATE OR REPLACE FUNCTION get_auditor_level_by_xp(p_xp INTEGER)
RETURNS TABLE (
    level_id TEXT,
    name TEXT,
    commission_rate NUMERIC,
    allowed_plans TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.level_id,
        al.name,
        al.commission_rate,
        al.allowed_plans
    FROM auditor_levels al
    WHERE al.min_xp <= p_xp
    ORDER BY al.min_xp DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 6. FUNÇÃO: Calcular valores financeiros
-- Chamada ao criar/atualizar uma auditoria
-- ============================================

CREATE OR REPLACE FUNCTION calculate_audit_financials(
    p_assignment_id UUID,
    p_total_amount NUMERIC
)
RETURNS JSONB AS $$
DECLARE
    v_auditor_id UUID;
    v_auditor_xp INTEGER;
    v_commission_rate NUMERIC;
    v_auditor_payout NUMERIC;
    v_platform_fee NUMERIC;
BEGIN
    -- Obter auditor_id e XP atual
    SELECT a.auditor_id INTO v_auditor_id
    FROM audit_assignments a
    WHERE a.id = p_assignment_id;

    SELECT COALESCE(p.gamification_xp, 0) INTO v_auditor_xp
    FROM profiles p
    WHERE p.id = v_auditor_id;

    -- Obter taxa de comissão pelo nível
    SELECT al.commission_rate INTO v_commission_rate
    FROM auditor_levels al
    WHERE al.min_xp <= v_auditor_xp
    ORDER BY al.min_xp DESC
    LIMIT 1;

    -- Default se não encontrar
    IF v_commission_rate IS NULL THEN
        v_commission_rate := 0.70;
    END IF;

    -- Calcular valores
    v_auditor_payout := p_total_amount * v_commission_rate;
    v_platform_fee := p_total_amount - v_auditor_payout;

    -- Atualizar assignment
    UPDATE audit_assignments
    SET 
        agreed_amount = p_total_amount,
        auditor_commission_rate = v_commission_rate,
        auditor_payout = v_auditor_payout,
        platform_fee = v_platform_fee
    WHERE id = p_assignment_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'agreed_amount', p_total_amount,
        'commission_rate', v_commission_rate,
        'auditor_payout', v_auditor_payout,
        'platform_fee', v_platform_fee
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. FUNÇÃO: Marcar pagamento como realizado
-- ============================================

CREATE OR REPLACE FUNCTION mark_audit_as_paid(
    p_assignment_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE audit_assignments
    SET 
        payment_status = 'paid',
        paid_at = NOW()
    WHERE id = p_assignment_id
    AND payment_status = 'pending';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. VIEW: Resumo Financeiro por Auditor
-- ============================================

CREATE OR REPLACE VIEW auditor_financial_summary AS
SELECT 
    p.id AS auditor_id,
    p.full_name AS auditor_name,
    p.gamification_xp,
    p.gamification_level,
    al.commission_rate AS current_rate,
    COUNT(aa.id) AS total_audits,
    COALESCE(SUM(aa.agreed_amount), 0) AS total_revenue,
    COALESCE(SUM(aa.auditor_payout), 0) AS total_earnings,
    COALESCE(SUM(CASE WHEN aa.payment_status = 'pending' THEN aa.auditor_payout ELSE 0 END), 0) AS pending_payout,
    COALESCE(SUM(CASE WHEN aa.payment_status = 'paid' THEN aa.auditor_payout ELSE 0 END), 0) AS paid_amount
FROM profiles p
LEFT JOIN auditor_levels al ON p.gamification_level = al.level_id
LEFT JOIN audit_assignments aa ON aa.auditor_id = p.id
WHERE p.role = 'auditor'
GROUP BY p.id, p.full_name, p.gamification_xp, p.gamification_level, al.commission_rate;

-- ============================================
-- COMENTÁRIOS
-- ============================================
COMMENT ON TABLE auditor_levels IS 'Níveis de auditor com taxas de comissão e permissões';
COMMENT ON FUNCTION get_auditor_level_by_xp IS 'Retorna o nível e taxa de comissão baseado no XP';
COMMENT ON FUNCTION calculate_audit_financials IS 'Calcula e atualiza os valores financeiros de uma auditoria';
COMMENT ON FUNCTION mark_audit_as_paid IS 'Marca uma auditoria como paga';
COMMENT ON VIEW auditor_financial_summary IS 'Resumo financeiro consolidado por auditor';
