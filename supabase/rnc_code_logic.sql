-- =============================================
-- Function: generate_next_rnc_code
-- Description: Gera o próximo código de RNC sequencial para uma empresa
-- =============================================

CREATE OR REPLACE FUNCTION generate_next_rnc_code(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_new_code TEXT;
    v_counter INTEGER;
    v_exists BOOLEAN;
BEGIN
    -- 1. Tentar encontrar o maior número sequencial atual
    -- Assume o formato RNC-001, RNC-002, etc.
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(code FROM '[0-9]+') AS INTEGER)), 
        0
    ) INTO v_counter
    FROM corrective_actions
    WHERE company_id = p_company_id;

    -- 2. Incrementar e verificar se já existe (loop de segurança)
    LOOP
        v_counter := v_counter + 1;
        v_new_code := 'RNC-' || LPAD(v_counter::TEXT, 3, '0');
        
        SELECT EXISTS (
            SELECT 1 FROM corrective_actions 
            WHERE company_id = p_company_id AND code = v_new_code
        ) INTO v_exists;
        
        EXIT WHEN NOT v_exists;
        
        -- Fallback para evitar loop infinito
        IF v_counter > 9999 THEN
            v_new_code := 'RNC-' || v_counter::TEXT;
            EXIT;
        END IF;
    END LOOP;

    RETURN v_new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões
GRANT EXECUTE ON FUNCTION generate_next_rnc_code(UUID) TO authenticated;
