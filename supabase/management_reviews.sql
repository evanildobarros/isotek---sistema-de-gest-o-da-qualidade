-- Tabela de Análise Crítica pela Direção (Management Review)
-- ISO 9001:2015 - 9.3 Análise Crítica pela Direção

-- Criar tipo enum para status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
        CREATE TYPE review_status AS ENUM ('draft', 'concluded');
    END IF;
END $$;

-- Criar tabela
CREATE TABLE IF NOT EXISTS public.management_reviews (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id uuid REFERENCES public.company_info(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    period_analyzed text, -- Ex: "Jan/2024 a Dez/2024"
    participants text NOT NULL, -- Quem estava presente
    inputs_json jsonb, -- Armazena as respostas dos tópicos obrigatórios (ISO 9.3.2)
    outputs_decisions text, -- Conclusões e ações decididas (ISO 9.3.3)
    status review_status DEFAULT 'draft',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.management_reviews IS 'Atas de Análise Crítica pela Direção (ISO 9001:2015 - 9.3)';
COMMENT ON COLUMN public.management_reviews.inputs_json IS 'Entradas obrigatórias: status ações anteriores, contexto, satisfação cliente, fornecedores, auditorias, KPIs';
COMMENT ON COLUMN public.management_reviews.outputs_decisions IS 'Saídas: melhorias, mudanças no SGQ, recursos necessários';

-- Índices
CREATE INDEX IF NOT EXISTS idx_management_reviews_company_id ON public.management_reviews(company_id);
CREATE INDEX IF NOT EXISTS idx_management_reviews_date ON public.management_reviews(date);
CREATE INDEX IF NOT EXISTS idx_management_reviews_status ON public.management_reviews(status);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_management_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    new.updated_at = now();
    RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS management_reviews_updated_at ON public.management_reviews;
CREATE TRIGGER management_reviews_updated_at
    BEFORE UPDATE ON public.management_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_management_reviews_updated_at();

-- Enable RLS
ALTER TABLE public.management_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Management reviews viewable by company members" ON public.management_reviews;
DROP POLICY IF EXISTS "Management reviews insertable by company members" ON public.management_reviews;
DROP POLICY IF EXISTS "Management reviews updatable by company members" ON public.management_reviews;
DROP POLICY IF EXISTS "Management reviews deletable by company members" ON public.management_reviews;

CREATE POLICY "Management reviews viewable by company members"
    ON public.management_reviews FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Management reviews insertable by company members"
    ON public.management_reviews FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Management reviews updatable by company members"
    ON public.management_reviews FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Management reviews deletable by company members"
    ON public.management_reviews FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    );
