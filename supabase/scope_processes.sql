-- Tabela Manual da Qualidade (para o Escopo)
CREATE TABLE IF NOT EXISTS public.quality_manual (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id uuid REFERENCES public.company_info(id) NOT NULL,
  scope text,
  applies_to_all_units boolean DEFAULT true,
  excluded_units text, -- Descrição das unidades excluídas se não se aplicar a todas
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure company_id exists for quality_manual
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_manual' AND column_name = 'company_id') THEN
        ALTER TABLE public.quality_manual ADD COLUMN company_id uuid REFERENCES public.company_info(id);
    END IF;
END $$;

-- Tabela de Processos
CREATE TABLE IF NOT EXISTS public.processes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id uuid REFERENCES public.company_info(id) NOT NULL,
  name text NOT NULL,
  owner text, -- Responsável pelo processo
  inputs text, -- Entradas
  outputs text, -- Saídas
  resources text, -- Recursos necessários
  created_at timestamptz DEFAULT now()
);

-- Ensure columns exist for processes (in case table existed with different schema)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'processes' AND column_name = 'company_id') THEN
        ALTER TABLE public.processes ADD COLUMN company_id uuid REFERENCES public.company_info(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'processes' AND column_name = 'owner') THEN
        ALTER TABLE public.processes ADD COLUMN owner text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'processes' AND column_name = 'inputs') THEN
        ALTER TABLE public.processes ADD COLUMN inputs text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'processes' AND column_name = 'outputs') THEN
        ALTER TABLE public.processes ADD COLUMN outputs text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'processes' AND column_name = 'resources') THEN
        ALTER TABLE public.processes ADD COLUMN resources text;
    END IF;
END $$;

-- RLS Policies
ALTER TABLE public.quality_manual ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid errors
DROP POLICY IF EXISTS "Quality Manual viewable by company members" ON public.quality_manual;
DROP POLICY IF EXISTS "Quality Manual insertable by company members" ON public.quality_manual;
DROP POLICY IF EXISTS "Quality Manual updatable by company members" ON public.quality_manual;

DROP POLICY IF EXISTS "Processes viewable by company members" ON public.processes;
DROP POLICY IF EXISTS "Processes insertable by company members" ON public.processes;
DROP POLICY IF EXISTS "Processes updatable by company members" ON public.processes;
DROP POLICY IF EXISTS "Processes deletable by company members" ON public.processes;

-- Policies for quality_manual
CREATE POLICY "Quality Manual viewable by company members"
  ON public.quality_manual FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Quality Manual insertable by company members"
  ON public.quality_manual FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Quality Manual updatable by company members"
  ON public.quality_manual FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Policies for processes
CREATE POLICY "Processes viewable by company members"
  ON public.processes FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Processes insertable by company members"
  ON public.processes FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Processes updatable by company members"
  ON public.processes FOR UPDATE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Processes deletable by company members"
  ON public.processes FOR DELETE
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
