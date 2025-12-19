-- ============================================
-- MIGRAÇÃO: Gerenciamento de Assinaturas e Limites
-- Isotek SGQ - Sistema de Gestão da Qualidade
-- ============================================

-- 1. Garante que a tabela company_info tenha os campos necessários
DO $$ 
BEGIN
    -- ID do Plano (Stripe Price ID ou slug)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_info' AND column_name = 'plan_id') THEN
        ALTER TABLE company_info ADD COLUMN plan_id TEXT DEFAULT 'start';
    END IF;

    -- Status da Assinatura
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_info' AND column_name = 'subscription_status') THEN
        ALTER TABLE company_info ADD COLUMN subscription_status TEXT DEFAULT 'active';
    END IF;

    -- Limites de Usuários
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_info' AND column_name = 'max_users') THEN
        ALTER TABLE company_info ADD COLUMN max_users INTEGER DEFAULT 1;
    END IF;

    -- Limites de Armazenamento (GB)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_info' AND column_name = 'max_storage_gb') THEN
        ALTER TABLE company_info ADD COLUMN max_storage_gb INTEGER DEFAULT 5;
    END IF;

    -- Data de Expiração da Assinatura
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_info' AND column_name = 'current_period_end') THEN
        ALTER TABLE company_info ADD COLUMN current_period_end TIMESTAMPTZ;
    END IF;

    -- ID do Cliente no Stripe (para faturamento)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_info' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE company_info ADD COLUMN stripe_customer_id TEXT;
    END IF;
END $$;

-- 2. Atualizar empresas existentes sem limites definidos
UPDATE company_info 
SET 
    max_users = COALESCE(max_users, 1),
    max_storage_gb = COALESCE(max_storage_gb, 5),
    plan_id = COALESCE(plan_id, 'start')
WHERE plan_id IS NULL OR max_users IS NULL;

-- 3. Criar Tabela de Faturas (Histórico) se não existir
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES company_info(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL, -- 'paid', 'open', 'void', 'uncollectible'
    invoice_pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para faturas
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver as faturas da sua própria empresa
DROP POLICY IF EXISTS "Usuários podem ver faturas da empresa" ON invoices;
CREATE POLICY "Usuários podem ver faturas da empresa" ON invoices
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Política: Super Admin pode ver tudo
DROP POLICY IF EXISTS "Super Admin vê todas as faturas" ON invoices;
CREATE POLICY "Super Admin vê todas as faturas" ON invoices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_super_admin = true
        )
    );

-- 4. Comentários para documentação
COMMENT ON TABLE invoices IS 'Histórico de faturamentos e pagamentos das empresas';
COMMENT ON COLUMN company_info.plan_id IS 'Identificador do plano atual (price_start_brl, price_pro_brl, etc)';
