-- Script para corrigir os nomes das colunas da tabela stakeholders
-- Renomeia do Português (existente) para Inglês (padrão do código)

DO $$
BEGIN
    -- Renomear "eu ia" (provável erro de digitação para id/uuid) para "id"
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'stakeholders' AND column_name = 'eu ia') THEN
        ALTER TABLE public.stakeholders RENAME COLUMN "eu ia" TO id;
    END IF;

    -- Renomear "nome" para "name"
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'stakeholders' AND column_name = 'nome') THEN
        ALTER TABLE public.stakeholders RENAME COLUMN nome TO name;
    END IF;

    -- Renomear "tipo" para "type"
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'stakeholders' AND column_name = 'tipo') THEN
        ALTER TABLE public.stakeholders RENAME COLUMN tipo TO type;
    END IF;

    -- Renomear "precisa" para "needs"
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'stakeholders' AND column_name = 'precisa') THEN
        ALTER TABLE public.stakeholders RENAME COLUMN precisa TO needs;
    END IF;

    -- Renomear "expectativas" para "expectations"
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'stakeholders' AND column_name = 'expectativas') THEN
        ALTER TABLE public.stakeholders RENAME COLUMN expectativas TO expectations;
    END IF;

    -- Renomear "frequência_de_monitoramento" para "monitor_frequency"
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'stakeholders' AND column_name = 'frequência_de_monitoramento') THEN
        ALTER TABLE public.stakeholders RENAME COLUMN "frequência_de_monitoramento" TO monitor_frequency;
    END IF;
    -- Caso esteja sem acento
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'stakeholders' AND column_name = 'frequencia_de_monitoramento') THEN
        ALTER TABLE public.stakeholders RENAME COLUMN "frequencia_de_monitoramento" TO monitor_frequency;
    END IF;

    -- Renomear "criado_em" para "created_at"
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'stakeholders' AND column_name = 'criado_em') THEN
        ALTER TABLE public.stakeholders RENAME COLUMN "criado_em" TO created_at;
    END IF;

    -- Renomear "id_da_empresa" para "company_id"
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'stakeholders' AND column_name = 'id_da_empresa') THEN
        ALTER TABLE public.stakeholders RENAME COLUMN "id_da_empresa" TO company_id;
    END IF;

END $$;
