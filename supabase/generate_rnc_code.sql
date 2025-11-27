-- Função para gerar o próximo código RNC automaticamente
-- Formato: RNC-YYYY-NNN (ex: RNC-2024-001, RNC-2024-002)

CREATE OR REPLACE FUNCTION generate_next_rnc_code(p_company_id uuid)
RETURNS text AS $$
DECLARE
    v_year text;
    v_last_number integer;
    v_next_number text;
    v_code text;
BEGIN
    -- Obter o ano atual
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    -- Buscar o último número de RNC do ano atual para esta empresa
    SELECT COALESCE(
        MAX(
            CAST(
                SUBSTRING(code FROM 'RNC-' || v_year || '-(\d+)')
                AS INTEGER
            )
        ), 
        0
    ) INTO v_last_number
    FROM public.corrective_actions
    WHERE company_id = p_company_id
    AND code LIKE 'RNC-' || v_year || '-%';
    
    -- Incrementar para o próximo número
    v_next_number := LPAD((v_last_number + 1)::text, 3, '0');
    
    -- Montar o código completo
    v_code := 'RNC-' || v_year || '-' || v_next_number;
    
    RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Comentário explicativo
COMMENT ON FUNCTION generate_next_rnc_code(uuid) IS 
'Gera o próximo código RNC sequencial para o ano atual no formato RNC-YYYY-NNN';

-- Teste da função (descomente para testar com um company_id real)
-- SELECT generate_next_rnc_code('seu-company-id-aqui');
