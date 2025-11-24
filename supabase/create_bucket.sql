-- Criar o bucket 'logos' explicitamente
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Garantir que as políticas de segurança existam (caso o script anterior não tenha funcionado por falta do bucket)

-- 1. Permitir acesso público para visualização (SELECT)
DROP POLICY IF EXISTS "Public logos are viewable" ON storage.objects;
CREATE POLICY "Public logos are viewable" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'logos');

-- 2. Permitir upload para usuários autenticados (INSERT)
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos');

-- 3. Permitir atualização/substituição para usuários autenticados (UPDATE)
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
CREATE POLICY "Authenticated users can update logos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'logos');

-- 4. Permitir deleção (opcional, mas útil)
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;
CREATE POLICY "Authenticated users can delete logos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'logos');
