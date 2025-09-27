-- =====================================================
-- POLITIQUES DE SÉCURITÉ SUPABASE STORAGE
-- Pour le bucket provider-documents
-- =====================================================

-- Politique 1: Les prestataires peuvent uploader leurs propres documents
CREATE POLICY "Providers can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'provider-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique 2: Les prestataires peuvent voir leurs propres documents
CREATE POLICY "Providers can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'provider-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique 3: Les admins peuvent voir tous les documents
CREATE POLICY "Admins can view all documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'provider-documents' AND
  auth.email() IN ('angeherboua@gmail.com', 'admin@linkup.cm')
);

-- Politique 4: Les prestataires peuvent supprimer leurs propres documents
CREATE POLICY "Providers can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'provider-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique 5: Permettre la lecture publique pour l'affichage (optionnel)
CREATE POLICY "Public read access for verified documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'provider-documents'
);

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🗂️ POLITIQUES STORAGE CONFIGURÉES !';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Upload autorisé pour les prestataires';
  RAISE NOTICE '✅ Lecture autorisée pour propriétaires + admins';
  RAISE NOTICE '✅ Suppression autorisée pour propriétaires';
  RAISE NOTICE '✅ Lecture publique pour affichage';
  RAISE NOTICE '';
  RAISE NOTICE '📁 Structure des dossiers :';
  RAISE NOTICE '   provider-documents/';
  RAISE NOTICE '   ├── [user-id]/';
  RAISE NOTICE '   │   ├── profile/';
  RAISE NOTICE '   │   │   └── photo.jpg';
  RAISE NOTICE '   │   └── identity/';
  RAISE NOTICE '   │       └── id-document.pdf';
  RAISE NOTICE '';
END $$;
