-- =============================================================================
-- MIGRAÇÃO: Configurações Globais do Sistema
-- Descrição: Cria tabela para armazenar parâmetros editáveis via UI
-- Data: 2025-12-28
-- =============================================================================

CREATE TABLE IF NOT EXISTS global_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

-- Inserir taxas padrão iniciais (Auditor Rates)
INSERT INTO global_settings (key, value)
VALUES ('auditor_rates', '{
    "bronze": 0.70,
    "silver": 0.75,
    "gold": 0.80,
    "platinum": 0.85,
    "diamond": 0.90
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Habilitar RLS
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Política: Apenas Super Admins podem ver e editar configurações globais
CREATE POLICY "Super Admins manage global settings"
ON global_settings FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_super_admin = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_super_admin = true
    )
);

-- Política para leitura pública (necessária para os cálculos na carteira do auditor)
-- Permitir que auditores leiam as taxas globais
CREATE POLICY "Logged in users can view global settings"
ON global_settings FOR SELECT
USING (auth.uid() IS NOT NULL);
