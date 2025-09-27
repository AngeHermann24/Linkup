-- =====================================================
-- SYSTÈME DE VÉRIFICATION - VERSION ULTRA SIMPLE
-- Aucune clé étrangère, compatible avec toute structure
-- =====================================================

-- Étape 1: Ajouter les colonnes une par une avec gestion d'erreur
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

-- Étape 2: Créer une table simple pour les documents (SANS clé étrangère)
CREATE TABLE IF NOT EXISTS provider_verification_docs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id TEXT NOT NULL, -- Juste du texte, pas de clé étrangère
  provider_email TEXT, -- Pour identifier facilement
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT false,
  verification_notes TEXT
);

-- Étape 3: Fonctions simples pour approuver/rejeter
CREATE OR REPLACE FUNCTION approve_provider_simple(
  provider_email TEXT,
  admin_email TEXT DEFAULT 'admin@linkup.cm',
  notes TEXT DEFAULT 'Approuvé par l''admin'
)
RETURNS TEXT AS $$
DECLARE
  result_message TEXT;
BEGIN
  UPDATE profiles 
  SET 
    verified = true,
    verification_status = 'approved',
    verified_at = NOW(),
    verified_by = admin_email,
    verification_notes = notes
  WHERE email = provider_email AND role = 'prestataire';
  
  IF FOUND THEN
    result_message := 'Prestataire ' || provider_email || ' approuvé avec succès';
  ELSE
    result_message := 'Prestataire ' || provider_email || ' non trouvé';
  END IF;
  
  RETURN result_message;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reject_provider_simple(
  provider_email TEXT,
  rejection_reason TEXT,
  admin_email TEXT DEFAULT 'admin@linkup.cm'
)
RETURNS TEXT AS $$
DECLARE
  result_message TEXT;
BEGIN
  UPDATE profiles 
  SET 
    verified = false,
    verification_status = 'rejected',
    verified_at = NOW(),
    verified_by = admin_email,
    verification_notes = rejection_reason
  WHERE email = provider_email AND role = 'prestataire';
  
  IF FOUND THEN
    result_message := 'Prestataire ' || provider_email || ' rejeté: ' || rejection_reason;
  ELSE
    result_message := 'Prestataire ' || provider_email || ' non trouvé';
  END IF;
  
  RETURN result_message;
END;
$$ LANGUAGE plpgsql;

-- Étape 4: Vue simple pour les prestataires en attente
CREATE OR REPLACE VIEW pending_providers_simple AS
SELECT 
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
  -- Simuler le nombre de documents
  CASE 
    WHEN profile_photo_url IS NOT NULL AND id_document_url IS NOT NULL THEN 2
    WHEN profile_photo_url IS NOT NULL OR id_document_url IS NOT NULL THEN 1
    ELSE 0
  END as documents_count
FROM profiles
WHERE role = 'prestataire' 
  AND COALESCE(verification_status, 'pending') = 'pending'
ORDER BY COALESCE(submitted_at, created_at) ASC;

-- Étape 5: Insérer des données de test
INSERT INTO profiles (full_name, email, phone, role, service_category, verification_status, submitted_at, profile_photo_url, id_document_url) VALUES
('Marie Coiffeuse Test', 'marie.test@linkup.cm', '+237 123 456 789', 'prestataire', 'Coiffure', 'pending', NOW() - INTERVAL '2 days', 'https://via.placeholder.com/150x150/667eea/ffffff?text=Marie', 'https://via.placeholder.com/300x200/764ba2/ffffff?text=ID-Marie'),
('Paul Plombier Test', 'paul.test@linkup.cm', '+237 234 567 890', 'prestataire', 'Plomberie', 'pending', NOW() - INTERVAL '1 day', 'https://via.placeholder.com/150x150/10b981/ffffff?text=Paul', 'https://via.placeholder.com/300x200/059669/ffffff?text=ID-Paul'),
('Sophie Ménage Test', 'sophie.test@linkup.cm', '+237 345 678 901', 'prestataire', 'Ménage', 'pending', NOW() - INTERVAL '3 hours', 'https://via.placeholder.com/150x150/f59e0b/ffffff?text=Sophie', 'https://via.placeholder.com/300x200/d97706/ffffff?text=ID-Sophie')
ON CONFLICT (email) DO UPDATE SET
  verification_status = EXCLUDED.verification_status,
  submitted_at = EXCLUDED.submitted_at,
  profile_photo_url = EXCLUDED.profile_photo_url,
  id_document_url = EXCLUDED.id_document_url;

-- Étape 6: Test des fonctions
DO $$
DECLARE
  test_result TEXT;
  pending_count INTEGER;
BEGIN
  -- Compter les prestataires en attente
  SELECT COUNT(*) INTO pending_count FROM pending_providers_simple;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔐 SYSTÈME DE VÉRIFICATION ULTRA-SIMPLE INSTALLÉ !';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Toutes les colonnes ajoutées à profiles';
  RAISE NOTICE '✅ Table provider_verification_docs créée (sans clé étrangère)';
  RAISE NOTICE '✅ Fonctions approve_provider_simple() et reject_provider_simple()';
  RAISE NOTICE '✅ Vue pending_providers_simple';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Statistiques :';
  RAISE NOTICE '   - Prestataires en attente : %', pending_count;
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test des fonctions :';
  
  -- Test d'approbation (commenté pour ne pas modifier les données)
  -- SELECT approve_provider_simple('marie.test@linkup.cm', 'admin@test.com', 'Test approbation') INTO test_result;
  -- RAISE NOTICE '   - Test approbation : %', test_result;
  
  RAISE NOTICE '   - Fonctions prêtes à être utilisées';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Utilisation :';
  RAISE NOTICE '   - Approuver : SELECT approve_provider_simple(''email@test.com'', ''admin@linkup.cm'', ''Notes'');';
  RAISE NOTICE '   - Rejeter : SELECT reject_provider_simple(''email@test.com'', ''Raison du rejet'', ''admin@linkup.cm'');';
  RAISE NOTICE '   - Voir en attente : SELECT * FROM pending_providers_simple;';
  RAISE NOTICE '';
END $$;
