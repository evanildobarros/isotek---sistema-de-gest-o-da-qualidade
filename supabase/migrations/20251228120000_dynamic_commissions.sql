-- =============================================================================
-- MIGRAÇÃO: Sistema Dinâmico de Comissões e Taxas
-- Data: 2025-12-28
-- =============================================================================

-- 1. Criar Tipo Enum para Tier de Comissão (se não existir)
DO $$ BEGIN
    CREATE TYPE commission_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Adicionar colunas na tabela profiles (onde residem os auditores)
-- Nota: O usuário pediu tabela "auditors", mas o sistema usa "profiles" para a entidade.
-- Para manter a compatibilidade com AuditorActionPanel e SuperAdminPage:
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS commission_tier commission_tier DEFAULT 'bronze',
ADD COLUMN IF NOT EXISTS custom_commission_rate DECIMAL(5,2);

-- 3. Comentário para documentar o uso
COMMENT ON COLUMN profiles.commission_tier IS 'Define o nível base de comissão (bronze: 70%, silver: 75%, gold: 80%)';
COMMENT ON COLUMN profiles.custom_commission_rate IS 'Porcentagem personalizada (0-100) que sobrescreve o nível (override).';
