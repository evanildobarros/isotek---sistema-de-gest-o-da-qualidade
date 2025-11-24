-- Script para corrigir permissões (RLS) da tabela company_info
-- Execute este script no SQL Editor do Supabase

-- 1. Habilitar RLS (garantir que está ativo)
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON company_info;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON company_info;
DROP POLICY IF EXISTS "Enable update for owner" ON company_info;
DROP POLICY IF EXISTS "Users can manage their own company" ON company_info;

-- 3. Criar novas políticas abrangentes

-- Permitir LEITURA para usuários autenticados (para encontrar sua empresa)
CREATE POLICY "Users can view own company" ON company_info
    FOR SELECT
    TO authenticated
    USING (auth.uid() = owner_id);

-- Permitir INSERÇÃO para usuários autenticados (para criar sua primeira empresa)
CREATE POLICY "Users can create company" ON company_info
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);

-- Permitir ATUALIZAÇÃO apenas para o dono
CREATE POLICY "Users can update own company" ON company_info
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- 4. Verificar se a empresa existe (Diagnóstico)
SELECT * FROM company_info WHERE owner_id = auth.uid();
