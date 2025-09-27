-- =====================================================
-- SYSTÈME DE VÉRIFICATION PRESTATAIRES - VERSION SIMPLE
-- Compatible avec votre structure existante
-- =====================================================

-- Ajouter les colonnes de vérification à la table profiles existante
DO $$
BEGIN
  -- Ajouter verified si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN verified BOOLEAN DEFAULT false;
    RAISE NOTICE 'Colonne verified ajoutée ✓';
  END IF;

  -- Ajouter verification_status si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN verification_status TEXT DEFAULT 'pending';
    RAISE NOTICE 'Colonne verification_status ajoutée ✓';
  END IF;

  -- Ajouter profile_photo_url si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'profile_photo_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_photo_url TEXT;
    RAISE NOTICE 'Colonne profile_photo_url ajoutée ✓';
  END IF;

  -- Ajouter id_document_url si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'id_document_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN id_document_url TEXT;
    RAISE NOTICE 'Colonne id_document_url ajoutée ✓';
  END IF;

  -- Ajouter verification_notes si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'verification_notes'
  ) THEN
    ALTER TABLE profiles ADD COLUMN verification_notes TEXT;
    RAISE NOTICE 'Colonne verification_notes ajoutée ✓';
  END IF;

  -- Ajouter submitted_at si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Colonne submitted_at ajoutée ✓';
  END IF;

  -- Ajouter verified_at si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Colonne verified_at ajoutée ✓';
  END IF;

  -- Ajouter verified_by si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN verified_by TEXT;
    RAISE NOTICE 'Colonne verified_by ajoutée ✓';
  END IF;
END $$;

-- Ajouter la contrainte de vérification pour verification_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_verification_status_check'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_verification_status_check 
    CHECK (verification_status IN ('pending', 'approved', 'rejected'));
    RAISE NOTICE 'Contrainte verification_status ajoutée ✓';
  END IF;
END $$;

-- Créer une table simple pour les documents (sans clé étrangère complexe)
CREATE TABLE IF NOT EXISTS provider_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL, -- Pas de clé étrangère pour éviter les erreurs
  document_type TEXT NOT NULL CHECK (document_type IN ('profile_photo', 'id_document', 'certificate', 'other')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT false,
  verification_notes TEXT
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(verified);
CREATE INDEX IF NOT EXISTS idx_provider_documents_provider_id ON provider_documents(provider_id);

-- Fonction pour approuver un prestataire
CREATE OR REPLACE FUNCTION approve_provider(
  provider_uuid UUID,
  admin_email TEXT,
  notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles 
  SET 
    verified = true,
    verification_status = 'approved',
    verified_at = NOW(),
    verified_by = admin_email,
    verification_notes = COALESCE(notes, 'Approuvé par l''admin')
  WHERE id = provider_uuid AND role = 'prestataire';
  
  -- Marquer tous les documents comme vérifiés
  UPDATE provider_documents 
  SET is_verified = true 
  WHERE provider_id = provider_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour rejeter un prestataire
CREATE OR REPLACE FUNCTION reject_provider(
  provider_uuid UUID,
  admin_email TEXT,
  rejection_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles 
  SET 
    verified = false,
    verification_status = 'rejected',
    verified_at = NOW(),
    verified_by = admin_email,
    verification_notes = rejection_reason
  WHERE id = provider_uuid AND role = 'prestataire';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Vue pour les prestataires en attente (version simple)
CREATE OR REPLACE VIEW pending_providers AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.service_category,
  p.profile_photo_url,
  p.id_document_url,
  COALESCE(p.verification_status, 'pending') as verification_status,
  p.submitted_at,
  p.created_at,
  -- Compter les documents (simulation si pas de documents)
  COALESCE((SELECT COUNT(*) FROM provider_documents pd WHERE pd.provider_id = p.id), 0) as documents_count,
  -- Vérifier si les documents requis sont présents
  CASE 
    WHEN p.profile_photo_url IS NOT NULL AND p.id_document_url IS NOT NULL THEN true
    ELSE false
  END as has_required_documents
FROM profiles p
WHERE p.role = 'prestataire' 
  AND COALESCE(p.verification_status, 'pending') = 'pending'
ORDER BY COALESCE(p.submitted_at, p.created_at) ASC;

-- Vue pour les statistiques de vérification
CREATE OR REPLACE VIEW verification_stats AS
SELECT 
  COUNT(*) FILTER (WHERE COALESCE(verification_status, 'pending') = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE verification_status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE verification_status = 'rejected') as rejected_count,
  COUNT(*) FILTER (WHERE COALESCE(verified, false) = true) as verified_count,
  COUNT(*) as total_providers,
  ROUND(
    (COUNT(*) FILTER (WHERE COALESCE(verified, false) = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
    2
  ) as verification_rate
FROM profiles 
WHERE role = 'prestataire';

-- Insérer des prestataires de test en attente
INSERT INTO profiles (id, full_name, email, phone, role, service_category, verification_status, submitted_at) VALUES
(gen_random_uuid(), 'Marie Coiffeuse', 'marie.coiffeuse@test.com', '+237 123 456 789', 'prestataire', 'Coiffure', 'pending', NOW() - INTERVAL '2 days'),
(gen_random_uuid(), 'Paul Plombier', 'paul.plombier@test.com', '+237 234 567 890', 'prestataire', 'Plomberie', 'pending', NOW() - INTERVAL '1 day'),
(gen_random_uuid(), 'Sophie Ménage', 'sophie.menage@test.com', '+237 345 678 901', 'prestataire', 'Ménage', 'pending', NOW() - INTERVAL '3 hours')
ON CONFLICT (email) DO NOTHING;

-- Ajouter des URLs de documents de test
UPDATE profiles 
SET 
  profile_photo_url = 'https://via.placeholder.com/150x150/667eea/ffffff?text=Photo',
  id_document_url = 'https://via.placeholder.com/300x200/764ba2/ffffff?text=ID'
WHERE email IN ('marie.coiffeuse@test.com', 'paul.plombier@test.com', 'sophie.menage@test.com');

-- Test des fonctions
DO $$
DECLARE
  test_stats RECORD;
BEGIN
  -- Tester la vue des statistiques
  SELECT * INTO test_stats FROM verification_stats LIMIT 1;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔐 SYSTÈME DE VÉRIFICATION INSTALLÉ AVEC SUCCÈS !';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Colonnes ajoutées à profiles';
  RAISE NOTICE '✅ Table provider_documents créée';
  RAISE NOTICE '✅ Fonctions approve_provider() et reject_provider()';
  RAISE NOTICE '✅ Vue pending_providers';
  RAISE NOTICE '✅ Vue verification_stats';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Statistiques actuelles :';
  RAISE NOTICE '   - Prestataires en attente : %', test_stats.pending_count;
  RAISE NOTICE '   - Prestataires approuvés : %', test_stats.approved_count;
  RAISE NOTICE '   - Total prestataires : %', test_stats.total_providers;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Prochaines étapes :';
  RAISE NOTICE '   1. Créer le bucket "provider-documents" dans Supabase Storage';
  RAISE NOTICE '   2. Tester l''interface admin de vérification';
  RAISE NOTICE '   3. Tester l''inscription prestataire avec upload';
  RAISE NOTICE '';
END $$;
