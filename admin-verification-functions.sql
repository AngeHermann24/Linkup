-- =====================================================
-- FONCTIONS ADMIN POUR VÉRIFICATION PRESTATAIRES
-- À exécuter dans Supabase SQL Editor
-- =====================================================

-- Fonction pour approuver un prestataire par email
CREATE OR REPLACE FUNCTION approve_provider_by_email(
  provider_email TEXT,
  admin_email TEXT DEFAULT 'angeherboua@gmail.com',
  notes TEXT DEFAULT 'Approuvé par l''admin'
)
RETURNS TEXT AS $$
DECLARE
  result_message TEXT;
  provider_name TEXT;
BEGIN
  -- Récupérer le nom du prestataire
  SELECT full_name INTO provider_name FROM profiles WHERE email = provider_email;
  
  -- Mettre à jour le statut de vérification
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

-- Fonction pour rejeter un prestataire par email
CREATE OR REPLACE FUNCTION reject_provider_by_email(
  provider_email TEXT,
  rejection_reason TEXT,
  admin_email TEXT DEFAULT 'angeherboua@gmail.com'
)
RETURNS TEXT AS $$
DECLARE
  result_message TEXT;
  provider_name TEXT;
BEGIN
  -- Récupérer le nom du prestataire
  SELECT full_name INTO provider_name FROM profiles WHERE email = provider_email;
  
  -- Mettre à jour le statut de vérification
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

-- Vue pour les prestataires en attente (si elle n'existe pas)
CREATE OR REPLACE VIEW pending_providers_view AS
SELECT 
  COALESCE(id::text, email) as provider_id,
  id,
  full_name,
  email,
  phone,
  service_category,
  profile_photo_url,
  id_document_url,
  COALESCE(verification_status, 'pending') as verification_status,
  submitted_at,
  created_at,
  -- Vérifier si les documents requis sont présents
  CASE 
    WHEN profile_photo_url IS NOT NULL AND id_document_url IS NOT NULL THEN true
    ELSE false
  END as has_required_documents,
  -- Compter les documents
  CASE 
    WHEN profile_photo_url IS NOT NULL AND id_document_url IS NOT NULL THEN 2
    WHEN profile_photo_url IS NOT NULL OR id_document_url IS NOT NULL THEN 1
    ELSE 0
  END as documents_count
FROM profiles
WHERE role = 'prestataire' 
  AND COALESCE(verification_status, 'pending') = 'pending'
ORDER BY COALESCE(submitted_at, created_at) ASC;

-- Test des fonctions
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ FONCTIONS DE VÉRIFICATION CRÉÉES !';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Fonctions disponibles :';
  RAISE NOTICE '   - approve_provider_by_email(email, admin, notes)';
  RAISE NOTICE '   - reject_provider_by_email(email, reason, admin)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Vue créée : pending_providers_view';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test manuel :';
  RAISE NOTICE '   SELECT approve_provider_by_email(''kubieai@gmail.com'', ''angeherboua@gmail.com'', ''Documents conformes'');';
  RAISE NOTICE '';
END $$;
