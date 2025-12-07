-- Política para leitura pública de logos (campos limitados)
-- Permite que visitantes não autenticados vejam logos na landing page

-- Ativar RLS na tabela se não estiver ativo
ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (apenas campos básicos serão retornados pelo select)
CREATE POLICY "public_read_logos"
ON company_info
FOR SELECT
TO anon, authenticated
USING (
    logo_url IS NOT NULL AND logo_url != ''
);
