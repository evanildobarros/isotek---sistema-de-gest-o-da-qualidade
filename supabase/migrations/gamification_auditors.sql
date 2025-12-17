-- ============================================
-- MIGRAÇÃO: Gamificação de Auditores
-- Isotek SGQ - Sistema de Gestão da Qualidade
-- ============================================

-- ============================================
-- 1. ATUALIZAR TABELA PROFILES
-- Adicionar campos de gamificação
-- ============================================

DO $$ 
BEGIN
    -- XP total do auditor
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'gamification_xp'
    ) THEN
        ALTER TABLE profiles ADD COLUMN gamification_xp INTEGER DEFAULT 0;
    END IF;

    -- Nível de gamificação (bronze, silver, gold, platinum, diamond)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'gamification_level'
    ) THEN
        ALTER TABLE profiles ADD COLUMN gamification_level TEXT DEFAULT 'bronze';
    END IF;

    -- Pontuação de reputação (0.0 a 5.0)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'reputation_score'
    ) THEN
        ALTER TABLE profiles ADD COLUMN reputation_score NUMERIC(3,2) DEFAULT 0.00;
    END IF;

    -- Contador de auditorias concluídas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'audits_completed'
    ) THEN
        ALTER TABLE profiles ADD COLUMN audits_completed INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================
-- 2. CRIAR TABELA BADGES (Catálogo de Medalhas)
-- ============================================

CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,                   -- Slug único (ex: 'speedster')
    name TEXT NOT NULL,                    -- Nome exibido
    description TEXT,                      -- Descrição da conquista
    icon_name TEXT NOT NULL,               -- Nome do ícone Lucide
    color TEXT NOT NULL,                   -- Classe Tailwind (ex: 'text-yellow-500')
    category TEXT DEFAULT 'achievement',   -- Categoria: achievement, milestone, special
    xp_reward INTEGER DEFAULT 0,           -- XP concedido ao ganhar
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. CRIAR TABELA USER_BADGES (Vínculo Usuário-Badge)
-- ============================================

CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    awarded_reason TEXT,                   -- Motivo específico da premiação
    
    -- Evitar duplicatas
    UNIQUE(user_id, badge_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- ============================================
-- 4. HABILITAR RLS (Row Level Security)
-- ============================================

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Políticas para badges (catálogo - todos podem ler)
DROP POLICY IF EXISTS "Todos podem ver badges" ON badges;
CREATE POLICY "Todos podem ver badges" ON badges
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super Admin gerencia badges" ON badges;
CREATE POLICY "Super Admin gerencia badges" ON badges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_super_admin = true
        )
    );

-- Políticas para user_badges
DROP POLICY IF EXISTS "Usuário vê suas próprias badges" ON user_badges;
CREATE POLICY "Usuário vê suas próprias badges" ON user_badges
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Qualquer um pode ver badges de auditores" ON user_badges;
CREATE POLICY "Qualquer um pode ver badges de auditores" ON user_badges
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = user_badges.user_id 
            AND profiles.role = 'auditor'
        )
    );

DROP POLICY IF EXISTS "Sistema concede badges" ON user_badges;
CREATE POLICY "Sistema concede badges" ON user_badges
    FOR INSERT WITH CHECK (
        -- Pode ser inserido pelo próprio sistema ou super admin
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.is_super_admin = true OR profiles.role = 'admin')
        )
    );

-- ============================================
-- 5. SEED DATA - Badges Iniciais
-- ============================================

INSERT INTO badges (id, name, description, icon_name, color, category, xp_reward)
VALUES 
    ('speedster', 'The Flash', 'Entregas rápidas e dentro do prazo', 'Zap', 'text-yellow-500', 'achievement', 100),
    ('eagle_eye', 'Olho de Águia', 'Alta qualidade técnica nas auditorias', 'Eye', 'text-purple-500', 'achievement', 150),
    ('client_favorite', 'Favorito dos Clientes', 'Avaliações 5 estrelas recorrentes', 'Heart', 'text-red-500', 'achievement', 200),
    ('veteran', 'Veterano Isotek', 'Mais de 1 ano na plataforma', 'Award', 'text-blue-500', 'milestone', 250),
    ('first_audit', 'Primeira Auditoria', 'Completou sua primeira auditoria', 'CheckCircle', 'text-green-500', 'milestone', 50),
    ('ten_audits', 'Dezena de Ouro', 'Completou 10 auditorias', 'Trophy', 'text-amber-500', 'milestone', 100),
    ('fifty_audits', 'Auditor Master', 'Completou 50 auditorias', 'Crown', 'text-orange-500', 'milestone', 500),
    ('hundred_audits', 'Lenda da Qualidade', 'Completou 100 auditorias', 'Star', 'text-rose-500', 'special', 1000),
    ('zero_nc', 'Zero NC', 'Auditoria sem nenhuma não conformidade encontrada', 'Shield', 'text-emerald-500', 'achievement', 75),
    ('mentor', 'Mentor', 'Ajudou a treinar novos auditores', 'Users', 'text-indigo-500', 'special', 300)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon_name = EXCLUDED.icon_name,
    color = EXCLUDED.color,
    category = EXCLUDED.category,
    xp_reward = EXCLUDED.xp_reward;

-- ============================================
-- 6. FUNÇÃO AUXILIAR: Calcular Nível com base em XP
-- ============================================

CREATE OR REPLACE FUNCTION get_gamification_level(xp INTEGER)
RETURNS TEXT AS $$
BEGIN
    IF xp >= 5000 THEN
        RETURN 'diamond';
    ELSIF xp >= 2500 THEN
        RETURN 'platinum';
    ELSIF xp >= 1000 THEN
        RETURN 'gold';
    ELSIF xp >= 500 THEN
        RETURN 'silver';
    ELSE
        RETURN 'bronze';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 7. TRIGGER: Atualizar nível automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_gamification_level()
RETURNS TRIGGER AS $$
BEGIN
    NEW.gamification_level := get_gamification_level(NEW.gamification_xp);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gamification_level ON profiles;
CREATE TRIGGER trigger_update_gamification_level
    BEFORE UPDATE OF gamification_xp ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_gamification_level();

-- ============================================
-- 8. RPC: Conceder XP ao auditor
-- ============================================

CREATE OR REPLACE FUNCTION award_xp_to_auditor(
    p_user_id UUID,
    p_xp_amount INTEGER,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE profiles
    SET gamification_xp = gamification_xp + p_xp_amount
    WHERE id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. RPC: Conceder badge ao auditor
-- ============================================

CREATE OR REPLACE FUNCTION award_badge_to_auditor(
    p_user_id UUID,
    p_badge_id TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_xp_reward INTEGER;
BEGIN
    -- Verificar se badge existe
    SELECT xp_reward INTO v_xp_reward FROM badges WHERE id = p_badge_id;
    
    IF v_xp_reward IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Inserir badge (ignora se já existir)
    INSERT INTO user_badges (user_id, badge_id, awarded_reason)
    VALUES (p_user_id, p_badge_id, p_reason)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
    
    -- Se inseriu (não era duplicata), conceder XP
    IF FOUND THEN
        PERFORM award_xp_to_auditor(p_user_id, v_xp_reward, 'Badge: ' || p_badge_id);
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMENTÁRIOS
-- ============================================
COMMENT ON TABLE badges IS 'Catálogo de badges/medalhas disponíveis no sistema de gamificação';
COMMENT ON TABLE user_badges IS 'Registro de badges conquistadas por cada usuário';
COMMENT ON FUNCTION get_gamification_level IS 'Retorna o nível de gamificação baseado no XP total';
COMMENT ON FUNCTION award_xp_to_auditor IS 'Concede XP a um auditor e atualiza automaticamente o nível';
COMMENT ON FUNCTION award_badge_to_auditor IS 'Concede uma badge ao auditor e o XP associado';
