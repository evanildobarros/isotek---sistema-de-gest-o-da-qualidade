-- ⚠️ CAUTION: This script drops the existing documents table to fix schema issues.
-- Only run this if you don't have important data in the 'documents' table yet.

DROP TABLE IF EXISTS public.documents CASCADE;

-- Create documents table for GED (Gestão Eletrônica de Documentos)
CREATE TABLE public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    code TEXT,
    version TEXT NOT NULL DEFAULT '1.0',
    status TEXT NOT NULL DEFAULT 'rascunho',
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('vigente', 'rascunho', 'obsoleto', 'em_aprovacao'))
);

-- Create index for faster queries
CREATE INDEX idx_documents_owner ON public.documents(owner_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_uploaded_at ON public.documents(uploaded_at DESC);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view all documents (company-wide visibility)
CREATE POLICY "Documents are viewable by authenticated users" 
    ON public.documents 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Users can insert their own documents
CREATE POLICY "Users can insert their own documents" 
    ON public.documents 
    FOR INSERT 
    WITH CHECK (auth.uid() = owner_id);

-- Users can update their own documents
CREATE POLICY "Users can update their own documents" 
    ON public.documents 
    FOR UPDATE 
    USING (auth.uid() = owner_id);

-- Users can delete their own documents
CREATE POLICY "Users can delete their own documents" 
    ON public.documents 
    FOR DELETE 
    USING (auth.uid() = owner_id);

-- Create storage bucket for documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
-- Note: If these policies already exist, the query might fail. 
-- You can ignore "policy already exists" errors or drop them first.

DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "Documents are publicly accessible" ON storage.objects;
CREATE POLICY "Documents are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
