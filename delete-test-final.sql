-- =====================================================
-- SUPPRESSION DÉFINITIVE DES DONNÉES DE TEST
-- Script ultra-direct pour nettoyer complètement
-- =====================================================

-- Supprimer TOUS les prestataires avec des emails de test
DELETE FROM profiles 
WHERE email LIKE '%test%' 
   OR email LIKE '%@test.com'
   OR full_name IN ('Marie Coiffeuse', 'Paul Plombier', 'Sophie Ménage')
   OR full_name LIKE '%Test%';

-- Supprimer spécifiquement les emails visibles
DELETE FROM profiles 
WHERE email IN (
  'marie.coiffeuse@test.com',
  'paul.plombier@test.com',
  'sophie.menage@test.com',
  'marie.verification@linkup.cm',
  'paul.verification@linkup.cm',
  'sophie.verification@linkup.cm'
);

-- Vérifier et afficher le résultat
DO $$
DECLARE
  total_prestataires INTEGER;
  prestataires_test INTEGER;
BEGIN
  -- Compter tous les prestataires
  SELECT COUNT(*) INTO total_prestataires 
  FROM profiles 
  WHERE role = 'prestataire';
  
  -- Compter les prestataires de test restants
  SELECT COUNT(*) INTO prestataires_test 
  FROM profiles 
  WHERE role = 'prestataire' 
    AND (email LIKE '%test%' OR full_name LIKE '%Test%' OR full_name IN ('Marie Coiffeuse', 'Paul Plombier', 'Sophie Ménage'));
  
  RAISE NOTICE '';
  RAISE NOTICE '🗑️ SUPPRESSION DÉFINITIVE TERMINÉE';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Total prestataires : %', total_prestataires;
  RAISE NOTICE '📊 Prestataires de test restants : %', prestataires_test;
  RAISE NOTICE '';
  
  IF prestataires_test = 0 THEN
    RAISE NOTICE '✅ SUCCÈS : Aucune donnée de test restante !';
  ELSE
    RAISE NOTICE '⚠️ ATTENTION : % données de test encore présentes', prestataires_test;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '📋 Prestataires restants :';
END $$;

-- Afficher tous les prestataires restants
SELECT 
  full_name as "Nom",
  email as "Email",
  role as "Rôle",
  verification_status as "Statut"
FROM profiles 
WHERE role = 'prestataire'
ORDER BY full_name;
