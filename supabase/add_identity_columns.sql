-- Adicionar colunas para Identidade Corporativa
ALTER TABLE company_info 
ADD COLUMN IF NOT EXISTS slogan TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Criar bucket de storage 'logos' (se não existir, precisa ser feito via dashboard ou API, mas podemos tentar criar policies)
-- Nota: A criação do bucket em si geralmente é feita via Dashboard ou API do Supabase, mas as policies podem ser via SQL.

-- Policy para permitir acesso público de leitura aos logos (necessário para exibir a imagem)
-- Assumindo que o bucket se chama 'logos'
BEGIN;
  -- Habilitar RLS para objects se ainda não estiver
  -- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

  -- Permitir upload para usuários autenticados no bucket 'logos'
  CREATE POLICY "Authenticated users can upload logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos');

  -- Permitir atualização (substituição) de logos
  CREATE POLICY "Authenticated users can update logos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'logos');

  -- Permitir leitura pública dos logos
  CREATE POLICY "Public logos are viewable" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'logos');
COMMIT;
