-- =====================================================
-- CORRECTION SYSTÈME DE VÉRIFICATION
-- Pour tables existantes
-- =====================================================

-- PARTIE 1: Vérifier et ajouter les colonnes manquantes seulement
DO $$
BEGIN
  -- Vérifier et ajouter les colonnes une par une
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verified') THEN
    ALTER TABLE profiles ADD COLUMN verified BOOLEAN DEFAULT false;
    RAISE NOTICE '✓ Colonne verified ajoutée';
  ELSE
    RAISE NOTICE '- Colonne verified existe déjà';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_status') THEN
    ALTER TABLE profiles ADD COLUMN verification_status TEXT DEFAULT 'pending';
    RAISE NOTICE '✓ Colonne verification_status ajoutée';
  ELSE
    RAISE NOTICE '- Colonne verification_status existe déjà';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'profile_photo_url') THEN
    ALTER TABLE profiles ADD COLUMN profile_photo_url TEXT;
    RAISE NOTICE '✓ Colonne profile_photo_url ajoutée';
  ELSE
    RAISE NOTICE '- Colonne profile_photo_url existe déjà';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'id_document_url') THEN
    ALTER TABLE profiles ADD COLUMN id_document_url TEXT;
    RAISE NOTICE '✓ Colonne id_document_url ajoutée';
  ELSE
    RAISE NOTICE '- Colonne id_document_url existe déjà';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verification_notes') THEN
    ALTER TABLE profiles ADD COLUMN verification_notes TEXT;
    RAISE NOTICE '✓ Colonne verification_notes ajoutée';
  ELSE
    RAISE NOTICE '- Colonne verification_notes existe déjà';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'submitted_at') THEN
    ALTER TABLE profiles ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✓ Colonne submitted_at ajoutée';
  ELSE
    RAISE NOTICE '- Colonne submitted_at existe déjà';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verified_at') THEN
    ALTER TABLE profiles ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✓ Colonne verified_at ajoutée';
  ELSE
    RAISE NOTICE '- Colonne verified_at existe déjà';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verified_by') THEN
    ALTER TABLE profiles ADD COLUMN verified_by TEXT;
    RAISE NOTICE '✓ Colonne verified_by ajoutée';
  ELSE
    RAISE NOTICE '- Colonne verified_by existe déjà';
  END IF;
END $$;

-- PARTIE 2: Supprimer les anciennes politiques et en créer de nouvelles
DO $$
BEGIN
  -- Supprimer les politiques existantes pour éviter les conflits
  DROP POLICY IF EXISTS "Providers upload own docs" ON storage.objects;
  DROP POLICY IF EXISTS "Providers view own docs" ON storage.objects;
  DROP POLICY IF EXISTS "Public read provider docs" ON storage.objects;
  DROP POLICY IF EXISTS "Providers delete own docs" ON storage.objects;
  DROP POLICY IF EXISTS "Providers can upload their own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Providers can view their own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Public read access for verified documents" ON storage.objects;
  DROP POLICY IF EXISTS "Providers can delete their own documents" ON storage.objects;
  
  RAISE NOTICE '✓ Anciennes politiques supprimées';
END $$;

-- PARTIE 3: Créer les nouvelles politiques
CREATE POLICY "provider_upload_policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'provider-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "provider_select_policy" ON storage.objects
FOR SELECT USING (
  bucket_id = 'provider-documents' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    auth.email() IN ('angeherboua@gmail.com', 'admin@linkup.cm')
  )
);

CREATE POLICY "provider_delete_policy" ON storage.objects
FOR DELETE USING (
  bucket_id = 'provider-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- PARTIE 4: Créer/Recréer les fonctions
CREATE OR REPLACE FUNCTION approve_provider_by_email(
  provider_email TEXT,
  admin_email TEXT DEFAULT 'admin@linkup.cm',
  notes TEXT DEFAULT 'Approuvé par l''admin'
)
RETURNS TEXT AS $$
DECLARE
  result_message TEXT;
  provider_name TEXT;
BEGIN
  SELECT full_name INTO provider_name FROM profiles WHERE email = provider_email;
  
  UPDATE profiles 
  SET 
    verified = true,
    verification_status = 'approved',
    verified_at = NOW(),
    verified_by = admin_email,
    verification_notes = notes
  WHERE email = provider_email AND role = 'prestataire';
  
  IF FOUND THEN
    result_message := 'Prestataire ' || COALESCE(provider_name, provider_email) || ' approuvé avec succès';
  ELSE
    result_message := 'Prestataire ' || provider_email || ' non trouvé';
  END IF;
  
  RETURN result_message;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reject_provider_by_email(
  provider_email TEXT,
  rejection_reason TEXT,
  admin_email TEXT DEFAULT 'admin@linkup.cm'
)
RETURNS TEXT AS $$
DECLARE
  result_message TEXT;
  provider_name TEXT;
BEGIN
  SELECT full_name INTO provider_name FROM profiles WHERE email = provider_email;
  
  UPDATE profiles 
  SET 
    verified = false,
    verification_status = 'rejected',
    verified_at = NOW(),
    verified_by = admin_email,
    verification_notes = rejection_reason
  WHERE email = provider_email AND role = 'prestataire';
  
  IF FOUND THEN
    result_message := 'Prestataire ' || COALESCE(provider_name, provider_email) || ' rejeté: ' || rejection_reason;
  ELSE
    result_message := 'Prestataire ' || provider_email || ' non trouvé';
  END IF;
  
  RETURN result_message;
END;
$$ LANGUAGE plpgsql;

-- PARTIE 5: Créer/Recréer la vue
CREATE OR REPLACE VIEW pending_providers_view AS
SELECT 
  COALESCE(id::text, email) as provider_id,
  full_name,
  email,
  phone,
  service_category,
  profile_photo_url,
  id_document_url,
  COALESCE(verification_status, 'pending') as verification_status,
  submitted_at,
  created_at,
  CASE 
    WHEN profile_photo_url IS NOT NULL AND id_document_url IS NOT NULL THEN true
    ELSE false
  END as has_required_documents,
  CASE 
    WHEN profile_photo_url IS NOT NULL AND id_document_url IS NOT NULL THEN 2
    WHEN profile_photo_url IS NOT NULL OR id_document_url IS NOT NULL THEN 1
    ELSE 0
  END as documents_count
FROM profiles
WHERE role = 'prestataire' 
  AND COALESCE(verification_status, 'pending') = 'pending'
ORDER BY COALESCE(submitted_at, created_at) ASC;

-- PARTIE 6: Vérification finale
DO $$
DECLARE
  bucket_exists BOOLEAN;
  table_exists BOOLEAN;
  pending_count INTEGER;
BEGIN
  -- Vérifier le bucket
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'provider-documents') INTO bucket_exists;
  
  -- Vérifier la table
  SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_documents') INTO table_exists;
  
  -- Compter les prestataires en attente
  SELECT COUNT(*) INTO pending_count FROM pending_providers_view;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔧 CORRECTION SYSTÈME DE VÉRIFICATION TERMINÉE !';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Table profiles : Colonnes vérifiées/ajoutées';
  RAISE NOTICE '✅ Table provider_documents : %', CASE WHEN table_exists THEN 'EXISTE' ELSE 'MANQUANTE' END;
  RAISE NOTICE '✅ Bucket provider-documents : %', CASE WHEN bucket_exists THEN 'EXISTE' ELSE 'MANQUANT' END;
  RAISE NOTICE '✅ Politiques de sécurité : MISES À JOUR';
  RAISE NOTICE '✅ Fonctions : CRÉÉES/MISES À JOUR';
  RAISE NOTICE '✅ Vue pending_providers_view : OPÉRATIONNELLE';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Prestataires en attente : %', pending_count;
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Tests :';
  RAISE NOTICE '   - Upload : http://localhost:3004/settings';
  RAISE NOTICE '   - Admin : http://localhost:3004/admin → 🔐 Vérification';
  RAISE NOTICE '   - SQL : SELECT * FROM pending_providers_view;';
  RAISE NOTICE '';
END $$;
