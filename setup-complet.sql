-- =====================================================
-- SETUP COMPLET SYSTÈME DE VÉRIFICATION + BUCKET
-- Exécuter ce script unique dans Supabase SQL Editor
-- =====================================================

-- PARTIE 1: AJOUTER LES COLONNES À PROFILES
DO $$
BEGIN
  BEGIN
    ALTER TABLE profiles ADD COLUMN verified BOOLEAN DEFAULT false;
    RAISE NOTICE '✓ Colonne verified ajoutée';
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE '- Colonne verified existe déjà';
  END;
END $$;

DO $$
BEGIN
  BEGIN
    ALTER TABLE profiles ADD COLUMN verification_status TEXT DEFAULT 'pending';
    RAISE NOTICE '✓ Colonne verification_status ajoutée';
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE '- Colonne verification_status existe déjà';
  END;
END $$;

DO $$
BEGIN
  BEGIN
    ALTER TABLE profiles ADD COLUMN profile_photo_url TEXT;
    RAISE NOTICE '✓ Colonne profile_photo_url ajoutée';
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE '- Colonne profile_photo_url existe déjà';
  END;
END $$;

DO $$
BEGIN
  BEGIN
    ALTER TABLE profiles ADD COLUMN id_document_url TEXT;
    RAISE NOTICE '✓ Colonne id_document_url ajoutée';
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE '- Colonne id_document_url existe déjà';
  END;
END $$;

DO $$
BEGIN
  BEGIN
    ALTER TABLE profiles ADD COLUMN verification_notes TEXT;
    RAISE NOTICE '✓ Colonne verification_notes ajoutée';
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE '- Colonne verification_notes existe déjà';
  END;
END $$;

DO $$
BEGIN
  BEGIN
    ALTER TABLE profiles ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✓ Colonne submitted_at ajoutée';
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE '- Colonne submitted_at existe déjà';
  END;
END $$;

DO $$
BEGIN
  BEGIN
    ALTER TABLE profiles ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✓ Colonne verified_at ajoutée';
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE '- Colonne verified_at existe déjà';
  END;
END $$;

DO $$
BEGIN
  BEGIN
    ALTER TABLE profiles ADD COLUMN verified_by TEXT;
    RAISE NOTICE '✓ Colonne verified_by ajoutée';
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE '- Colonne verified_by existe déjà';
  END;
END $$;

-- PARTIE 2: CRÉER LE BUCKET STORAGE
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'provider-documents',
  'provider-documents', 
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- PARTIE 3: CRÉER LES TABLES ET FONCTIONS
CREATE TABLE IF NOT EXISTS provider_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id TEXT NOT NULL, -- ID du prestataire
  document_type TEXT NOT NULL CHECK (document_type IN ('profile_photo', 'id_document', 'certificate', 'other')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT false,
  verification_notes TEXT
);

-- PARTIE 4: FONCTIONS D'APPROBATION/REJET
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

-- PARTIE 5: VUE POUR LES PRESTATAIRES EN ATTENTE
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

-- PARTIE 6: POLITIQUES DE SÉCURITÉ STORAGE
CREATE POLICY "Providers upload own docs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'provider-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Providers view own docs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'provider-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public read provider docs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'provider-documents'
);

CREATE POLICY "Providers delete own docs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'provider-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- PARTIE 7: SYSTÈME PRÊT POUR TOUS LES PRESTATAIRES
-- Aucune donnée de test - Le système fonctionnera avec vos vrais prestataires

-- MESSAGE FINAL
DO $$
DECLARE
  bucket_exists BOOLEAN;
  pending_count INTEGER;
BEGIN
  -- Vérifier le bucket
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'provider-documents') INTO bucket_exists;
  
  -- Compter les prestataires en attente
  SELECT COUNT(*) INTO pending_count FROM pending_providers_view;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 SYSTÈME DE VÉRIFICATION INSTALLÉ !';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Colonnes ajoutées à profiles';
  RAISE NOTICE '✅ Bucket provider-documents : %', CASE WHEN bucket_exists THEN 'CRÉÉ' ELSE 'ERREUR' END;
  RAISE NOTICE '✅ Tables et fonctions créées';
  RAISE NOTICE '✅ Politiques de sécurité configurées';
  RAISE NOTICE '✅ Vue pending_providers_view opérationnelle';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Prestataires actuels en attente : %', pending_count;
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Système prêt pour vos prestataires :';
  RAISE NOTICE '   - Inscription avec vérification : http://localhost:3004/settings';
  RAISE NOTICE '   - Panel admin : http://localhost:3004/admin → 🔐 Vérification';
  RAISE NOTICE '   - Voir en attente : SELECT * FROM pending_providers_view;';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Les prestataires peuvent maintenant :';
  RAISE NOTICE '   1. Aller dans Paramètres';
  RAISE NOTICE '   2. Uploader photo + pièce d''identité';
  RAISE NOTICE '   3. Attendre validation admin';
  RAISE NOTICE '';
END $$;
