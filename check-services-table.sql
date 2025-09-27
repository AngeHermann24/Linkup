-- =====================================================
-- VÉRIFICATION DES SERVICES ET PRESTATAIRES
-- Voir pourquoi les services n'apparaissent pas côté client
-- =====================================================

-- 1. Vérifier les prestataires existants
SELECT 
  id,
  full_name as "Nom",
  email as "Email",
  service_category as "Service",
  verification_status as "Statut",
  created_at as "Inscrit le"
FROM profiles 
WHERE role = 'prestataire'
ORDER BY created_at DESC;

-- 2. Vérifier si la table provider_services existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_services') THEN
    RAISE NOTICE '✅ Table provider_services existe';
  ELSE
    RAISE NOTICE '❌ Table provider_services n''existe pas';
  END IF;
END $$;

-- 3. Vérifier les services existants (si la table existe)
SELECT COUNT(*) as "Nombre de services" FROM provider_services;

-- 4. Vérifier si la vue provider_services_with_images existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'provider_services_with_images') THEN
    RAISE NOTICE '✅ Vue provider_services_with_images existe';
  ELSE
    RAISE NOTICE '❌ Vue provider_services_with_images n''existe pas';
  END IF;
END $$;

-- 5. Voir les services avec prestataires (si la vue existe)
SELECT 
  ps.service_name as "Service",
  ps.title as "Titre",
  ps.base_price as "Prix",
  p.full_name as "Prestataire",
  p.verification_status as "Statut Prestataire"
FROM provider_services ps
JOIN profiles p ON ps.provider_id = p.id
WHERE p.role = 'prestataire'
ORDER BY ps.created_at DESC;

-- 6. Résumé du problème
DO $$
DECLARE
  prestataires_count INTEGER;
  services_count INTEGER;
  verified_count INTEGER;
BEGIN
  -- Compter les prestataires
  SELECT COUNT(*) INTO prestataires_count FROM profiles WHERE role = 'prestataire';
  
  -- Compter les prestataires vérifiés
  SELECT COUNT(*) INTO verified_count FROM profiles WHERE role = 'prestataire' AND verification_status = 'approved';
  
  -- Compter les services (si la table existe)
  BEGIN
    SELECT COUNT(*) INTO services_count FROM provider_services;
  EXCEPTION
    WHEN undefined_table THEN
      services_count := 0;
  END;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 DIAGNOSTIC SERVICES PRESTATAIRES';
  RAISE NOTICE '';
  RAISE NOTICE '👥 Total prestataires : %', prestataires_count;
  RAISE NOTICE '✅ Prestataires vérifiés : %', verified_count;
  RAISE NOTICE '🛍️ Services créés : %', services_count;
  RAISE NOTICE '';
  
  IF services_count = 0 THEN
    RAISE NOTICE '🚨 PROBLÈME : Aucun service créé !';
    RAISE NOTICE '💡 SOLUTION : Les prestataires doivent créer leurs services';
  END IF;
  
  IF verified_count = 0 THEN
    RAISE NOTICE '🚨 PROBLÈME : Aucun prestataire vérifié !';
    RAISE NOTICE '💡 SOLUTION : Approuver les prestataires via l''admin';
  END IF;
END $$;
