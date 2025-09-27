-- =====================================================
-- CRÉATION DU BUCKET PROVIDER-DOCUMENTS
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- Créer le bucket provider-documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'provider-documents',
  'provider-documents', 
  true,
  52428800, -- 50MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Vérifier que le bucket a été créé
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM storage.buckets WHERE id = 'provider-documents'
  ) INTO bucket_exists;
  
  IF bucket_exists THEN
    RAISE NOTICE '✅ Bucket "provider-documents" créé avec succès !';
    RAISE NOTICE '📁 Bucket public : OUI';
    RAISE NOTICE '📏 Limite de taille : 50MB';
    RAISE NOTICE '📎 Types autorisés : JPG, PNG, PDF';
  ELSE
    RAISE NOTICE '❌ Erreur : Bucket non créé';
  END IF;
END $$;

-- Maintenant, ajouter les politiques de sécurité
-- Politique 1: Upload pour les propriétaires
CREATE POLICY "Providers can upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'provider-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique 2: Lecture pour les propriétaires
CREATE POLICY "Providers can view own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'provider-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique 3: Lecture publique (pour affichage)
CREATE POLICY "Public read for provider documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'provider-documents'
);

-- Politique 4: Suppression pour les propriétaires
CREATE POLICY "Providers can delete own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'provider-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Message final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 BUCKET ET POLITIQUES CONFIGURÉS !';
  RAISE NOTICE '';
  RAISE NOTICE 'Vous pouvez maintenant :';
  RAISE NOTICE '1. Tester l''upload depuis l''app';
  RAISE NOTICE '2. Voir les fichiers dans Storage > provider-documents';
  RAISE NOTICE '3. Vérifier les permissions';
  RAISE NOTICE '';
END $$;
