-- =====================================================
-- MISE À JOUR DE LA TABLE SERVICE_CATEGORIES
-- Met à jour les services existants sans créer de doublons
-- =====================================================

-- Vérifier si la table existe déjà
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_categories') THEN
    RAISE NOTICE '✅ Table service_categories existe déjà';
  ELSE
    RAISE NOTICE '❌ Table service_categories n''existe pas';
  END IF;
END $$;

-- Voir les services existants
SELECT name, plan_type, is_active FROM service_categories ORDER BY plan_type, name;

-- Mettre à jour ou insérer les services (UPSERT)
INSERT INTO service_categories (name, description, plan_type, icon, is_active) VALUES
-- Services Basic (1000 FCFA)
('Toclo Toclo', 'Transport en moto-taxi', 'basic', '🏍️', true),
('Fanicko', 'Livraison à domicile', 'basic', '🚲', true),
('Technicien de surface', 'Nettoyage professionnel', 'basic', '🧹', true),
('Peintre', 'Peinture et décoration', 'basic', '🎨', true),
('Jardinage', 'Entretien et aménagement de jardins', 'basic', '🌱', true),
('Ménage', 'Nettoyage et entretien ménager', 'basic', '🧹', true),

-- Services Pro (3000 FCFA)
('Mécanicien', 'Réparation et entretien automobile', 'pro', '🔧', true),
('Plomberie', 'Réparation et installation de plomberie', 'pro', '🔧', true),
('Électricité', 'Installation et réparation électrique', 'pro', '⚡', true),
('Coiffure', 'Services de coiffure et beauté', 'pro', '✂️', true),
('Traiteur', 'Services de restauration et traiteur', 'pro', '🍽️', true),
('Maquilleuse', 'Services de maquillage professionnel', 'pro', '💄', true),
('Pâtissier', 'Création de pâtisseries et desserts', 'pro', '🎂', true)

ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  plan_type = EXCLUDED.plan_type,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Vérifier le résultat final
DO $$
DECLARE
  total_services INTEGER;
  basic_count INTEGER;
  pro_count INTEGER;
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_services FROM service_categories;
  SELECT COUNT(*) INTO basic_count FROM service_categories WHERE plan_type = 'basic';
  SELECT COUNT(*) INTO pro_count FROM service_categories WHERE plan_type = 'pro';
  SELECT COUNT(*) INTO active_count FROM service_categories WHERE is_active = true;
  
  RAISE NOTICE '';
  RAISE NOTICE '🛍️ SERVICES LINKUP MIS À JOUR !';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Total services : %', total_services;
  RAISE NOTICE '📦 Services Basic (1000 FCFA) : %', basic_count;
  RAISE NOTICE '💼 Services Pro (3000 FCFA) : %', pro_count;
  RAISE NOTICE '✅ Services actifs : %', active_count;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Interface admin maintenant opérationnelle !';
  RAISE NOTICE '   - Ajout/Modification/Suppression réels';
  RAISE NOTICE '   - Sauvegarde en base de données';
  RAISE NOTICE '   - Fini le mode démo';
  RAISE NOTICE '';
END $$;

-- Afficher tous les services finaux
SELECT 
  name as "Service",
  plan_type as "Plan", 
  icon as "Icône",
  is_active as "Actif",
  description as "Description"
FROM service_categories 
ORDER BY plan_type, name;
