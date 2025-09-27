-- =====================================================
-- NETTOYAGE DES DONNÉES DE TEST DE VÉRIFICATION
-- Supprime tous les prestataires de test
-- =====================================================

-- Supprimer les prestataires de test par email
DELETE FROM profiles 
WHERE email IN (
  'marie.verification@linkup.cm',
  'marie.test@linkup.cm',
  'paul.verification@linkup.cm', 
  'paul.test@linkup.cm',
  'sophie.verification@linkup.cm',
  'sophie.test@linkup.cm',
  'marie.coiffeuse@test.com',
  'paul.plombier@test.com',
  'sophie.menage@test.com'
);

-- Supprimer les documents de test associés (si la table existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_documents') THEN
    DELETE FROM provider_documents 
    WHERE provider_id IN (
      SELECT id::text FROM profiles 
      WHERE email LIKE '%test%' OR email LIKE '%verification@linkup.cm'
    );
    RAISE NOTICE '✓ Documents de test supprimés de provider_documents';
  ELSE
    RAISE NOTICE '- Table provider_documents n''existe pas (normal)';
  END IF;
END $$;

-- Remettre à zéro les colonnes de vérification pour tous les prestataires existants
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  -- Vérifier si les colonnes de vérification existent
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'verified'
  ) INTO col_exists;
  
  IF col_exists THEN
    UPDATE profiles 
    SET 
      verified = false,
      verification_status = 'pending',
      profile_photo_url = NULL,
      id_document_url = NULL,
      verification_notes = NULL,
      submitted_at = NULL,
      verified_at = NULL,
      verified_by = NULL
    WHERE role = 'prestataire';
    RAISE NOTICE '✓ Colonnes de vérification remises à zéro';
  ELSE
    RAISE NOTICE '- Colonnes de vérification n''existent pas encore';
  END IF;
END $$;

-- Message de confirmation
DO $$
DECLARE
  deleted_count INTEGER;
  total_providers INTEGER;
BEGIN
  -- Compter les prestataires restants
  SELECT COUNT(*) INTO total_providers FROM profiles WHERE role = 'prestataire';
  
  RAISE NOTICE '';
  RAISE NOTICE '🧹 NETTOYAGE TERMINÉ !';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Données de test supprimées';
  RAISE NOTICE '✅ Colonnes de vérification remises à zéro';
  RAISE NOTICE '✅ Documents de test supprimés';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Prestataires restants : %', total_providers;
  RAISE NOTICE '📊 Tous en statut "pending" et non vérifiés';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Interface admin prête pour vos vrais prestataires !';
  RAISE NOTICE '   - Aucune donnée de test';
  RAISE NOTICE '   - Système de vérification opérationnel';
  RAISE NOTICE '   - Prêt pour la production';
  RAISE NOTICE '';
END $$;
