-- =====================================================
-- SYSTÈME DE VÉRIFICATION - VERSION FINALE
-- Résout le problème d'ID NULL et toutes les contraintes
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
  doc_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_email TEXT NOT NULL, -- Utiliser l'email au lieu de l'ID
  provider_name TEXT,
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
  -- Récupérer le nom du prestataire
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
  -- Récupérer le nom du prestataire
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

-- Étape 4: Vue simple pour les prestataires en attente
CREATE OR REPLACE VIEW pending_providers_view AS
SELECT 
  COALESCE(id::text, email) as provider_id, -- Utiliser email si ID pose problème
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

-- Étape 5: Insérer des données de test SEULEMENT si elles n'existent pas
DO $$
BEGIN
  -- Vérifier si les emails de test existent déjà
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'marie.verification@linkup.cm') THEN
    INSERT INTO profiles (full_name, email, phone, role, service_category, verification_status, submitted_at, profile_photo_url, id_document_url) VALUES
    ('Marie Coiffeuse Vérif', 'marie.verification@linkup.cm', '+237 123 456 789', 'prestataire', 'Coiffure', 'pending', NOW() - INTERVAL '2 days', 'https://via.placeholder.com/150x150/667eea/ffffff?text=Marie', 'https://via.placeholder.com/300x200/764ba2/ffffff?text=ID-Marie');
    RAISE NOTICE '✓ Marie Coiffeuse ajoutée pour test';
  ELSE
    RAISE NOTICE '- Marie Coiffeuse existe déjà';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'paul.verification@linkup.cm') THEN
    INSERT INTO profiles (full_name, email, phone, role, service_category, verification_status, submitted_at, profile_photo_url, id_document_url) VALUES
    ('Paul Plombier Vérif', 'paul.verification@linkup.cm', '+237 234 567 890', 'prestataire', 'Plomberie', 'pending', NOW() - INTERVAL '1 day', 'https://via.placeholder.com/150x150/10b981/ffffff?text=Paul', 'https://via.placeholder.com/300x200/059669/ffffff?text=ID-Paul');
    RAISE NOTICE '✓ Paul Plombier ajouté pour test';
  ELSE
    RAISE NOTICE '- Paul Plombier existe déjà';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'sophie.verification@linkup.cm') THEN
    INSERT INTO profiles (full_name, email, phone, role, service_category, verification_status, submitted_at, profile_photo_url, id_document_url) VALUES
    ('Sophie Ménage Vérif', 'sophie.verification@linkup.cm', '+237 345 678 901', 'prestataire', 'Ménage', 'pending', NOW() - INTERVAL '3 hours', 'https://via.placeholder.com/150x150/f59e0b/ffffff?text=Sophie', 'https://via.placeholder.com/300x200/d97706/ffffff?text=ID-Sophie');
    RAISE NOTICE '✓ Sophie Ménage ajoutée pour test';
  ELSE
    RAISE NOTICE '- Sophie Ménage existe déjà';
  END IF;
END $$;

-- Étape 6: Test et statistiques
DO $$
DECLARE
  pending_count INTEGER;
  total_providers INTEGER;
BEGIN
  -- Compter les prestataires
  SELECT COUNT(*) INTO pending_count FROM pending_providers_view;
  SELECT COUNT(*) INTO total_providers FROM profiles WHERE role = 'prestataire';
  
  RAISE NOTICE '';
  RAISE NOTICE '🔐 SYSTÈME DE VÉRIFICATION FINAL INSTALLÉ !';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Toutes les colonnes ajoutées à profiles';
  RAISE NOTICE '✅ Table provider_verification_docs créée';
  RAISE NOTICE '✅ Fonctions approve_provider_by_email() et reject_provider_by_email()';
  RAISE NOTICE '✅ Vue pending_providers_view';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Statistiques :';
  RAISE NOTICE '   - Prestataires en attente : %', pending_count;
  RAISE NOTICE '   - Total prestataires : %', total_providers;
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Commandes de test :';
  RAISE NOTICE '   - Voir en attente : SELECT * FROM pending_providers_view;';
  RAISE NOTICE '   - Approuver Marie : SELECT approve_provider_by_email(''marie.verification@linkup.cm'', ''admin@linkup.cm'', ''Documents conformes'');';
  RAISE NOTICE '   - Rejeter Paul : SELECT reject_provider_by_email(''paul.verification@linkup.cm'', ''Photo floue'', ''admin@linkup.cm'');';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Interface Admin : http://localhost:3003/admin → 🔐 Vérification';
  RAISE NOTICE '';
END $$;
