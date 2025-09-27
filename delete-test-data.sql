-- =====================================================
-- SUPPRESSION DIRECTE DES DONNÉES DE TEST VISIBLES
-- Supprime les prestataires de test spécifiques
-- =====================================================

-- Supprimer les prestataires de test par nom et email
DELETE FROM profiles 
WHERE 
  full_name IN ('Marie Coiffeuse', 'Paul Plombier', 'Sophie Ménage', 'Marie Coiffeuse Test', 'Paul Plombier Test', 'Sophie Ménage Test')
  OR email IN (
    'marie.coiffeuse@test.com',
    'paul.plombier@test.com', 
    'sophie.menage@test.com',
    'marie.verification@linkup.cm',
    'paul.verification@linkup.cm',
    'sophie.verification@linkup.cm'
  );

-- Vérifier le résultat
DO $$
DECLARE
  remaining_count INTEGER;
  test_count INTEGER;
BEGIN
  -- Compter les prestataires restants
  SELECT COUNT(*) INTO remaining_count FROM profiles WHERE role = 'prestataire';
  
  -- Compter les prestataires de test restants
  SELECT COUNT(*) INTO test_count FROM profiles 
  WHERE role = 'prestataire' 
    AND (full_name LIKE '%Test%' OR email LIKE '%test%' OR email LIKE '%@test.com');
  
  RAISE NOTICE '';
  RAISE NOTICE '🗑️ SUPPRESSION DES DONNÉES DE TEST';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Prestataires de test supprimés';
  RAISE NOTICE '📊 Prestataires restants : %', remaining_count;
  RAISE NOTICE '📊 Données de test restantes : %', test_count;
  RAISE NOTICE '';
  
  IF test_count = 0 THEN
    RAISE NOTICE '🎉 Interface admin maintenant propre !';
  ELSE
    RAISE NOTICE '⚠️ Il reste % données de test', test_count;
  END IF;
  
  RAISE NOTICE '';
END $$;
