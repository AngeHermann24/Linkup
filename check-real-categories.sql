-- =====================================================
-- VÉRIFICATION DES VRAIES CATÉGORIES EXISTANTES
-- Voir quelles catégories sont déjà dans la base
-- =====================================================

-- Vérifier si la table service_categories existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_categories') THEN
    RAISE NOTICE '✅ Table service_categories existe';
  ELSE
    RAISE NOTICE '❌ Table service_categories n''existe pas';
  END IF;
END $$;

-- Voir toutes les catégories existantes (si la table existe)
SELECT 
  name as "Nom",
  description as "Description", 
  plan_type as "Plan",
  icon as "Icône",
  is_active as "Actif"
FROM service_categories 
ORDER BY plan_type, name;

-- Voir les services utilisés par les prestataires
SELECT DISTINCT 
  service_category as "Catégorie Utilisée",
  COUNT(*) as "Nombre de Prestataires"
FROM profiles 
WHERE role = 'prestataire' 
  AND service_category IS NOT NULL
GROUP BY service_category
ORDER BY COUNT(*) DESC;

-- Résumé
DO $$
DECLARE
  categories_count INTEGER;
  services_used_count INTEGER;
BEGIN
  -- Compter les catégories dans la table (si elle existe)
  BEGIN
    SELECT COUNT(*) INTO categories_count FROM service_categories;
  EXCEPTION
    WHEN undefined_table THEN
      categories_count := 0;
  END;
  
  -- Compter les services utilisés par les prestataires
  SELECT COUNT(DISTINCT service_category) INTO services_used_count 
  FROM profiles 
  WHERE role = 'prestataire' AND service_category IS NOT NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 RÉSUMÉ DES CATÉGORIES';
  RAISE NOTICE '';
  RAISE NOTICE '🗂️ Catégories dans service_categories : %', categories_count;
  RAISE NOTICE '👥 Services utilisés par prestataires : %', services_used_count;
  RAISE NOTICE '';
END $$;
