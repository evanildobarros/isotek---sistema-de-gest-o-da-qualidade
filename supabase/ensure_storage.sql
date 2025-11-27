-- Script para Garantir Buckets de Storage e Políticas de Segurança
-- Cria os buckets se não existirem e aplica políticas RLS.

-- 1. Criar Buckets (se não existirem)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('logos', 'logos', true),
  ('documents', 'documents', true),
  ('certificates', 'certificates', true),
  ('nc_photos', 'nc_photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Remover Políticas Antigas (para evitar conflitos/duplicatas)
-- Logos
DROP POLICY IF EXISTS "Logos Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Logos Upload Auth" ON storage.objects;
DROP POLICY IF EXISTS "Logos Update Auth" ON storage.objects;
DROP POLICY IF EXISTS "Logos Delete Auth" ON storage.objects;

-- Documents
DROP POLICY IF EXISTS "Documents Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Documents Upload Auth" ON storage.objects;
DROP POLICY IF EXISTS "Documents Update Auth" ON storage.objects;
DROP POLICY IF EXISTS "Documents Delete Auth" ON storage.objects;

-- Certificates
DROP POLICY IF EXISTS "Certificates Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Certificates Upload Auth" ON storage.objects;
DROP POLICY IF EXISTS "Certificates Update Auth" ON storage.objects;
DROP POLICY IF EXISTS "Certificates Delete Auth" ON storage.objects;

-- NC Photos
DROP POLICY IF EXISTS "NC Photos Public Access" ON storage.objects;
DROP POLICY IF EXISTS "NC Photos Upload Auth" ON storage.objects;
DROP POLICY IF EXISTS "NC Photos Update Auth" ON storage.objects;
DROP POLICY IF EXISTS "NC Photos Delete Auth" ON storage.objects;


-- 3. Criar Novas Políticas Padronizadas

-- LOGOS
CREATE POLICY "Logos Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Logos Upload Auth" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
CREATE POLICY "Logos Update Auth" ON storage.objects FOR UPDATE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
CREATE POLICY "Logos Delete Auth" ON storage.objects FOR DELETE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- DOCUMENTS
CREATE POLICY "Documents Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Documents Upload Auth" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "Documents Update Auth" ON storage.objects FOR UPDATE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "Documents Delete Auth" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- CERTIFICATES
CREATE POLICY "Certificates Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'certificates');
CREATE POLICY "Certificates Upload Auth" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'certificates' AND auth.role() = 'authenticated');
CREATE POLICY "Certificates Update Auth" ON storage.objects FOR UPDATE USING (bucket_id = 'certificates' AND auth.role() = 'authenticated');
CREATE POLICY "Certificates Delete Auth" ON storage.objects FOR DELETE USING (bucket_id = 'certificates' AND auth.role() = 'authenticated');

-- NC PHOTOS
CREATE POLICY "NC Photos Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'nc_photos');
CREATE POLICY "NC Photos Upload Auth" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'nc_photos' AND auth.role() = 'authenticated');
CREATE POLICY "NC Photos Update Auth" ON storage.objects FOR UPDATE USING (bucket_id = 'nc_photos' AND auth.role() = 'authenticated');
CREATE POLICY "NC Photos Delete Auth" ON storage.objects FOR DELETE USING (bucket_id = 'nc_photos' AND auth.role() = 'authenticated');
