-- =============================================
-- CRÉATION DU BUCKET DE STOCKAGE
-- =============================================

-- Créer le bucket "documents" pour stocker les fichiers uploadés
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  52428800, -- 50 MB limit
  ARRAY[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- .docx
    'application/msword', -- .doc
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Politique pour permettre la lecture publique
CREATE POLICY "Public can read documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Politique pour permettre la mise à jour aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

-- Politique pour permettre la suppression aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
