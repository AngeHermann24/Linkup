-- =====================================================
-- SYSTÈME DE VÉRIFICATION PRESTATAIRES
-- Ajout des champs pour validation et documents
-- =====================================================

-- Ajouter les colonnes nécessaires à la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_document_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_by TEXT;

-- Créer une table pour les documents de vérification
CREATE TABLE IF NOT EXISTS provider_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_provider_documents_type ON provider_documents(document_type);

-- Trigger pour mettre à jour submitted_at quand des documents sont ajoutés
CREATE OR REPLACE FUNCTION update_provider_submission_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour submitted_at dans profiles quand un document est uploadé
  UPDATE profiles 
  SET submitted_at = NOW(),
      verification_status = 'pending'
  WHERE id = NEW.provider_id 
    AND submitted_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_submission_date
  AFTER INSERT ON provider_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_submission_date();

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

-- Vue pour les prestataires en attente de vérification
CREATE OR REPLACE VIEW pending_providers AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.service_category,
  p.profile_photo_url,
  p.id_document_url,
  p.verification_status,
  p.submitted_at,
  p.created_at,
  -- Compter les documents uploadés
  (SELECT COUNT(*) FROM provider_documents pd WHERE pd.provider_id = p.id) as documents_count,
  -- Vérifier si tous les documents requis sont présents
  (
    SELECT COUNT(*) FROM provider_documents pd 
    WHERE pd.provider_id = p.id 
    AND pd.document_type IN ('profile_photo', 'id_document')
  ) >= 2 as has_required_documents
FROM profiles p
WHERE p.role = 'prestataire' 
  AND p.verification_status = 'pending'
  AND p.submitted_at IS NOT NULL
ORDER BY p.submitted_at ASC;

-- Vue pour les statistiques de vérification
CREATE OR REPLACE VIEW verification_stats AS
SELECT 
  COUNT(*) FILTER (WHERE verification_status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE verification_status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE verification_status = 'rejected') as rejected_count,
  COUNT(*) FILTER (WHERE verified = true) as verified_count,
  COUNT(*) as total_providers,
  ROUND(
    (COUNT(*) FILTER (WHERE verified = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
    2
  ) as verification_rate
FROM profiles 
WHERE role = 'prestataire';

-- Fonction pour obtenir les détails d'un prestataire avec ses documents
CREATE OR REPLACE FUNCTION get_provider_verification_details(provider_uuid UUID)
RETURNS TABLE (
  provider_id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  service_category TEXT,
  verification_status TEXT,
  verified BOOLEAN,
  submitted_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by TEXT,
  verification_notes TEXT,
  documents JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.service_category,
    p.verification_status,
    p.verified,
    p.submitted_at,
    p.verified_at,
    p.verified_by,
    p.verification_notes,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', pd.id,
            'document_type', pd.document_type,
            'file_name', pd.file_name,
            'file_url', pd.file_url,
            'upload_date', pd.upload_date,
            'is_verified', pd.is_verified
          )
        )
        FROM provider_documents pd 
        WHERE pd.provider_id = p.id
      ),
      '[]'::json
    ) as documents
  FROM profiles p
  WHERE p.id = provider_uuid AND p.role = 'prestataire';
END;
$$ LANGUAGE plpgsql;

-- Politique de sécurité pour Supabase Storage (à exécuter dans Supabase Dashboard)
-- CREATE POLICY "Providers can upload their own documents" ON storage.objects
-- FOR INSERT WITH CHECK (
--   bucket_id = 'provider-documents' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- CREATE POLICY "Providers can view their own documents" ON storage.objects
-- FOR SELECT USING (
--   bucket_id = 'provider-documents' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- CREATE POLICY "Admins can view all documents" ON storage.objects
-- FOR SELECT USING (
--   bucket_id = 'provider-documents' AND
--   auth.email() = 'angeherboua@gmail.com'
-- );

-- Insérer des données de test pour les prestataires en attente
INSERT INTO profiles (id, full_name, email, phone, role, service_category, verification_status, submitted_at) VALUES
(gen_random_uuid(), 'Marie Coiffeuse', 'marie.coiffeuse@test.com', '+237 123 456 789', 'prestataire', 'Coiffure', 'pending', NOW() - INTERVAL '2 days'),
(gen_random_uuid(), 'Paul Plombier', 'paul.plombier@test.com', '+237 234 567 890', 'prestataire', 'Plomberie', 'pending', NOW() - INTERVAL '1 day'),
(gen_random_uuid(), 'Sophie Ménage', 'sophie.menage@test.com', '+237 345 678 901', 'prestataire', 'Ménage', 'pending', NOW() - INTERVAL '3 hours')
ON CONFLICT (email) DO NOTHING;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔐 SYSTÈME DE VÉRIFICATION PRESTATAIRES INSTALLÉ !';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Colonnes ajoutées à profiles :';
  RAISE NOTICE '   - verified (boolean)';
  RAISE NOTICE '   - verification_status (pending/approved/rejected)';
  RAISE NOTICE '   - profile_photo_url, id_document_url';
  RAISE NOTICE '   - verification_notes, submitted_at, verified_at';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Table provider_documents créée';
  RAISE NOTICE '✅ Fonctions approve_provider() et reject_provider()';
  RAISE NOTICE '✅ Vue pending_providers pour l''admin';
  RAISE NOTICE '✅ Vue verification_stats pour les statistiques';
  RAISE NOTICE '✅ Trigger automatique pour submitted_at';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Prochaines étapes :';
  RAISE NOTICE '   1. Créer le bucket "provider-documents" dans Supabase Storage';
  RAISE NOTICE '   2. Modifier le formulaire d''inscription prestataire';
  RAISE NOTICE '   3. Ajouter la section vérification dans l''admin';
  RAISE NOTICE '';
END $$;
