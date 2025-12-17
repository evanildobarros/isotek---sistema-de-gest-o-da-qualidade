-- =============================================================================
-- MIGRAÇÃO: Engine de Gamificação (XP Ledger e Triggers)
-- Data: 2025-12-17
-- Descr: Implementa histórico de XP e automação de recompensas por eventos
-- =============================================================================

-- 1. Tabela de Histórico de XP (XP Ledger)
CREATE TABLE IF NOT EXISTS xp_ledger (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    action_type text NOT NULL CHECK (action_type IN ('audit_completed', 'five_star_review', 'fast_validation', 'penalty', 'manual_adjustment')),
    xp_amount integer NOT NULL, -- Pode ser negativo
    reference_id uuid, -- ID da auditoria ou review
    reason text, -- Descrição legível (ex: "Auditoria #123 Concluída")
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para xp_ledger
CREATE INDEX IF NOT EXISTS xp_ledger_user_id_idx ON xp_ledger(user_id);
CREATE INDEX IF NOT EXISTS xp_ledger_created_at_idx ON xp_ledger(created_at DESC);

-- RLS para xp_ledger
ALTER TABLE xp_ledger ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seu próprio histórico
CREATE POLICY "Users can view own xp history" ON xp_ledger
    FOR SELECT USING (auth.uid() = user_id);

-- Apenas sistema/admins podem inserir (via funções SECURITY DEFINER)
-- Nenhuma política de INSERT pública

-- 2. Tabela de Avaliações de Auditoria (Audit Reviews)
CREATE TABLE IF NOT EXISTS audit_reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_id uuid REFERENCES audits(id) ON DELETE CASCADE NOT NULL,
    reviewer_id uuid REFERENCES auth.users(id), -- Quem avaliou (opcional, pode ser anônimo ou externo)
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb -- Para guardar info extra (IP, email externo, etc)
);

-- Índices para audit_reviews
CREATE INDEX IF NOT EXISTS audit_reviews_audit_id_idx ON audit_reviews(audit_id);

-- RLS para audit_reviews
ALTER TABLE audit_reviews ENABLE ROW LEVEL SECURITY;

-- Visualização: Membros da empresa e o auditor responsável podem ver
CREATE POLICY "Reviews viewable by stakeholders" ON audit_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM audits a
            WHERE a.id = audit_reviews.audit_id
            AND (
                a.company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()) -- Membros da empresa
                OR 
                EXISTS (SELECT 1 FROM audit_assignments aa WHERE aa.company_id = a.company_id AND aa.auditor_id = auth.uid()) -- Auditor responsável
            )
        )
    );

-- Inserção: Autenticados podem avaliar (refinar conforme regra de negócio e.g. apenas cliente)
CREATE POLICY "Authenticated can create reviews" ON audit_reviews
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- 3. Função Central para Adicionar XP (com verificação de nível)
CREATE OR REPLACE FUNCTION add_auditor_xp(
    p_user_id uuid,
    p_amount integer,
    p_action_type text,
    p_reference_id uuid DEFAULT NULL,
    p_reason text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_current_xp integer;
    v_new_xp integer;
    v_current_level text;
    v_new_level text;
    v_level_record record;
BEGIN
    -- 1. Inserir no Ledger
    INSERT INTO xp_ledger (user_id, xp_amount, action_type, reference_id, reason)
    VALUES (p_user_id, p_amount, p_action_type, p_reference_id, p_reason);

    -- 2. Atualizar Perfil
    UPDATE profiles
    SET gamification_xp = COALESCE(gamification_xp, 0) + p_amount
    WHERE id = p_user_id
    RETURNING gamification_xp, gamification_level INTO v_new_xp, v_current_level;

    -- 3. Verificar e Atualizar Nível
    -- Busca o nível adequado para o novo XP
    SELECT * INTO v_level_record
    FROM auditor_levels
    WHERE min_xp <= v_new_xp
    ORDER BY min_xp DESC
    LIMIT 1;

    IF FOUND AND v_level_record.level_id IS DISTINCT FROM v_current_level THEN
        -- Subiu (ou desceu) de nível
        UPDATE profiles
        SET 
            gamification_level = v_level_record.level_id
            -- commission_rate poderia ser atualizado aqui se fosse armazenado no perfil,
            -- mas atualmente é puxado da tabela auditor_levels ou snapshot na assignment.
        WHERE id = p_user_id;

        -- Opcional: Criar notificação de Level Up na tabela de notificações (se existir)
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Trigger: Recompensa por Conclusão de Auditoria
CREATE OR REPLACE FUNCTION trigger_reward_audit_completion()
RETURNS trigger AS $$
DECLARE
    v_auditor_id uuid;
BEGIN
    -- Verifica se mudou para 'completed' (ou 'paid' se preferir recompensar no pagamento)
    -- Assumindo status 'completed' na tabela audit_assignments
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        v_auditor_id := NEW.auditor_id;
        
        -- Adiciona 500 XP
        PERFORM add_auditor_xp(
            v_auditor_id, 
            500, 
            'audit_completed', 
            NEW.id, 
            'Conclusão de Auditoria'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger em audit_assignments
DROP TRIGGER IF EXISTS on_audit_complete_reward ON audit_assignments;
CREATE TRIGGER on_audit_complete_reward
    AFTER UPDATE ON audit_assignments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_reward_audit_completion();


-- 5. Trigger: Recompensa/Penalidade por Avaliação
CREATE OR REPLACE FUNCTION trigger_reward_audit_review()
RETURNS trigger AS $$
DECLARE
    v_auditor_id uuid;
    v_audit_reference uuid;
BEGIN
    v_audit_reference := NEW.audit_id;
    
    -- Descobrir quem é o auditor dessa auditoria
    -- Busca na audit_assignments vinculada à company da audit (assumindo 1 auditor principal por enquanto)
    SELECT aa.auditor_id INTO v_auditor_id
    FROM audit_assignments aa
    JOIN audits a ON a.company_id = aa.company_id -- vínculo indireto, ideal seria assignment direto na audit, mas modelo atual é por company/periodo
    WHERE a.id = v_audit_reference
    AND aa.status = 'completed' -- Auditor deve ter completado
    LIMIT 1; 
    
    -- NOTA: O modelo de dados atual vincula assignments à company_id, não diretamente a audits especificas (id).
    -- Se houver vínculo direto (audit_id em audit_assignments), ajustar query acima.
    -- Assumindo vínculo indireto, pode ser impreciso se houver múltiplos auditores no mesmo período.
    -- Ajuste: Se audit_assignments tiver audit_id, usar direto. Se não, precisaremos melhorar o modelo depois.
    -- Por hora, vamos tentar achar o auditor ativo mais recente se não tiver audit_id.

    IF v_auditor_id IS NOT NULL THEN
        IF NEW.rating = 5 THEN
            -- Bônus 5 Estrelas
            PERFORM add_auditor_xp(
                v_auditor_id, 
                300, 
                'five_star_review', 
                NEW.id, 
                'Avaliação 5 Estrelas'
            );
        ELSIF NEW.rating <= 2 THEN
            -- Penalidade
            PERFORM add_auditor_xp(
                v_auditor_id, 
                -200, 
                'penalty', 
                NEW.id, 
                'Avaliação Negativa'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger em audit_reviews
DROP TRIGGER IF EXISTS on_audit_review_reward ON audit_reviews;
CREATE TRIGGER on_audit_review_reward
    AFTER INSERT ON audit_reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_reward_audit_review();
