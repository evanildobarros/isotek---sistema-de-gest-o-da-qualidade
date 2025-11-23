-- =====================================================
-- Script de criação da tabela de Auditorias (ISO 9001)
-- =====================================================
-- Este script cria a estrutura necessária para gerenciar
-- auditorias internas e externas do sistema de gestão.

DROP TABLE IF EXISTS public.audits CASCADE;

-- Criar tabela de auditorias
CREATE TABLE public.audits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scope TEXT NOT NULL,                    -- Escopo da auditoria (ex: "Vendas e Marketing")
    type TEXT NOT NULL,                     -- Tipo (ex: "Auditoria Interna", "Auditoria Externa")
    auditor TEXT NOT NULL,                  -- Nome do auditor responsável
    date DATE NOT NULL,                     -- Data da auditoria
    status TEXT NOT NULL DEFAULT 'Agendada',-- Status atual
    progress INTEGER NOT NULL DEFAULT 0,    -- Progresso (0-100%)
    department TEXT,                        -- Departamento auditado
    non_conformities INTEGER DEFAULT 0,     -- Número de não conformidades encontradas
    observations TEXT,                      -- Observações gerais
    report_url TEXT,                        -- URL do relatório final
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint para validar status
    CONSTRAINT valid_status CHECK (status IN ('Agendada', 'Em Andamento', 'Concluída', 'Atrasada', 'Cancelada')),
    
    -- Constraint para validar progresso
    CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 100)
);

-- Criar índices para otimizar consultas
CREATE INDEX idx_audits_date ON public.audits(date DESC);
CREATE INDEX idx_audits_status ON public.audits(status);
CREATE INDEX idx_audits_created_by ON public.audits(created_by);
CREATE INDEX idx_audits_type ON public.audits(type);

-- Criar função para atualizar o timestamp de updated_at automaticamente
CREATE OR REPLACE FUNCTION update_audits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para executar a função antes de cada UPDATE
DROP TRIGGER IF EXISTS trigger_update_audits_updated_at ON public.audits;
CREATE TRIGGER trigger_update_audits_updated_at
    BEFORE UPDATE ON public.audits
    FOR EACH ROW
    EXECUTE FUNCTION update_audits_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Políticas RLS (Row Level Security)
-- =====================================================

-- Política de SELECT: Usuários autenticados podem ver todas as auditorias
CREATE POLICY "Audits are viewable by authenticated users" 
    ON public.audits 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Política de INSERT: Usuários autenticados podem criar auditorias
CREATE POLICY "Users can insert audits" 
    ON public.audits 
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);

-- Política de UPDATE: Usuários podem atualizar qualquer auditoria
-- (Para permitir que auditores atualizem auditorias de outros usuários)
CREATE POLICY "Authenticated users can update audits" 
    ON public.audits 
    FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Política de DELETE: Apenas criadores ou admins podem excluir
CREATE POLICY "Users can delete their own audits" 
    ON public.audits 
    FOR DELETE 
    USING (auth.uid() = created_by);

-- =====================================================
-- Dados de exemplo (MOCK DATA) - Opcional
-- =====================================================
-- Descomente as linhas abaixo se quiser inserir dados de exemplo

/*
INSERT INTO public.audits (scope, type, auditor, date, status, progress, department, non_conformities, created_by)
VALUES 
    ('Vendas e Marketing', 'Auditoria Interna', 'Carlos Silva', '2024-03-10', 'Concluída', 100, 'Vendas', 2, auth.uid()),
    ('Produção - Linha 1', 'Auditoria de Processo', 'Evanildo Barros', '2024-11-25', 'Agendada', 0, 'Produção', 0, auth.uid()),
    ('Compras', 'Auditoria Interna', 'Ana Souza', '2024-11-20', 'Em Andamento', 45, 'Compras', 1, auth.uid());
*/

-- =====================================================
-- Comentários nas colunas (Documentação)
-- =====================================================
COMMENT ON TABLE public.audits IS 'Tabela para gerenciamento de auditorias ISO 9001 (internas e externas)';
COMMENT ON COLUMN public.audits.scope IS 'Escopo ou área da auditoria';
COMMENT ON COLUMN public.audits.type IS 'Tipo de auditoria (Interna, Externa, Processo, etc)';
COMMENT ON COLUMN public.audits.status IS 'Status: Agendada, Em Andamento, Concluída, Atrasada, Cancelada';
COMMENT ON COLUMN public.audits.progress IS 'Percentual de progresso da auditoria (0-100)';
COMMENT ON COLUMN public.audits.non_conformities IS 'Número de não conformidades identificadas';
